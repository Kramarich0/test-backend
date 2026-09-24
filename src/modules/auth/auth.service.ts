import { verifyPassword } from '#common/utils/hash.util.js';
import type { EnvironmentVariables } from '#config/env.validation.js';
import { DBService } from '#db/db.service.js';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
      omit: { tokenV: false },
    });

    const tokens = await this.generateTokens(updatedAdmin);
    return {
      ...tokens,
      admin: {
        id: updatedAdmin.id,
        email: updatedAdmin.email,
        name: updatedAdmin.name,
        role: updatedAdmin.role,
        createdAt: updatedAdmin.createdAt,
        updatedAt: updatedAdmin.updatedAt,
      },
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
    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token invalid or expired');
    }

    const rotated = await this.dbService.admin.updateMany({
      where: {
        id: payload.sub,
        tokenV: payload.tokenV,
      },
      data: { tokenV: { increment: 1 } },
    });

    if (rotated.count === 0) {
      throw new UnauthorizedException('Session expired');
    }

    const admin = await this.dbService.admin.findUnique({
      where: {
        id: payload.sub,
      },
      omit: { tokenV: false },
    });

    if (!admin) {
      throw new UnauthorizedException('Session expired');
    }

    return await this.generateTokens(admin);
  }
}
