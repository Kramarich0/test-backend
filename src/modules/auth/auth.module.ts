import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';

@Global()
@Module({
  imports: [JwtModule.register({}), PassportModule.register({ defaultStrategy: 'jwt' })],
  exports: [AuthService, JwtModule, PassportModule],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
