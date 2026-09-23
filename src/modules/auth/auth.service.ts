import { verifyPassword } from '#common/utils/hash.util.js';
import type { EnvironmentVariables } from '#config/env.validation.js';
import { ConfigService } from '@nestjs/config';
import { DBService } from '#db/db.service.js';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { LoginDto } from './dto/login.dto.js';
import type { JwtPayload, SafeAdmin } from './types/auth.types.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly dbService: DBService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateTokens(admin: SafeAdmin) {
    const payload: JwtPayload = {
      sub: admin.id,
      role: admin.role,
      tokenV: admin.tokenV,
      email: admin.email,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      expiresIn:
        this.configService.getOrThrow<EnvironmentVariables['JWT_EXPIRES_IN']>('JWT_EXPIRES_IN'),
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn:
        this.configService.getOrThrow<EnvironmentVariables['JWT_REFRESH_EXPIRES_IN']>(
          'JWT_REFRESH_EXPIRES_IN',
        ),
    });

    return { accessToken, refreshToken };
  }

  async login(dto: LoginDto) {
    const admin = await this.dbService.admin.findUnique({
      where: {
        email: dto.email,
      },
      omit: { password: false },
    });

    if (!admin) {
      throw new UnauthorizedException('Invalid Password or Email');
    }

    const isPasswordCorrect = await verifyPassword(dto.password, admin.password);

    if (!isPasswordCorrect) {
      throw new UnauthorizedException('Invalid Password or Email');
    }

    const updatedAdmin = await this.dbService.admin.update({
      where: { id: admin.id },
      data: { tokenV: { increment: 1 } },
    });

    const tokens = await this.generateTokens(updatedAdmin);
    return {
      admin: updatedAdmin,
      tokens,
    };
  }

  async logout(adminId: string) {
    await this.dbService.admin.update({
      where: { id: adminId },
      data: { tokenV: { increment: 1 } },
    });

    return { success: true };
  }

  async refresh(refreshToken: string) {
    try {
      const payload: JwtPayload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });

      const admin = await this.dbService.admin.findUnique({
        where: {
          id: payload.sub,
        },
      });

      if (!admin || admin.tokenV !== payload.tokenV) {
        throw new UnauthorizedException('Session expired');
      }

      const tokens = await this.generateTokens(admin);

      return { tokens };
    } catch {
      throw new UnauthorizedException('Refresh token invalid or expired');
    }
  }
}
