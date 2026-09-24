import { CurrentUser } from '#common/decorators/current-user.decorator.js';
import { Public } from '#common/decorators/public.decorator.js';
import { Auth } from '#common/decorators/roles.decorator.js';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import {
  LoginResponseDto,
  LogoutResponseDto,
  RefreshResponseDto,
} from './dto/auth-response.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshDto } from './dto/refresh.dto.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Log in administrator',
    description:
      'Authenticates administrator with email/password and issues access & refresh JWT tokens with single-session tracking.',
  })
  @ApiOkResponse({
    description:
      'Authenticated successfully. Returns access token, refresh token, and administrator profile.',
    type: LoginResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password.' })
  async login(@Body() dto: LoginDto) {
    return await this.authService.login(dto);
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Validates refresh token and issues a new pair of JWT tokens.',
  })
  @ApiOkResponse({
    description: 'Tokens refreshed successfully.',
    type: RefreshResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired refresh token, or session invalidated.',
  })
  async refresh(@Body() dto: RefreshDto) {
    return await this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Log out current administrator',
    description: 'Increments token version in DB, instantly invalidating the current session.',
  })
  @ApiOkResponse({
    description: 'Logged out successfully.',
    type: LogoutResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized or token invalid.' })
  async logout(@CurrentUser('id') adminId: string) {
    return await this.authService.logout(adminId);
  }
}
