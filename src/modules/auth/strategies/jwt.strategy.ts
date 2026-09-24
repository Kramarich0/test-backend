import { ConfigService } from '@nestjs/config';
import { DBService } from '#db/db.service.js';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { JwtPayload } from '../types/auth.types.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly dbService: DBService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const admin = await this.dbService.admin.findUnique({
      where: {
        id: payload.sub,
      },
      omit: { tokenV: false },
    });

    if (!admin || admin.tokenV !== payload.tokenV) {
      throw new UnauthorizedException('Session expired');
    }

    return admin;
  }
}
