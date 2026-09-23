import { CurrentUser } from '#common/decorators/current-user.decorator.js';
import { Auth } from '#common/decorators/roles.decorator.js';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshDto } from './dto/refresh.dto.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Log in administrator',
    description:
      'Authenticates administrator with email/password and issues access & refresh JWT tokens with single-session tracking.',
  })
  @ApiOkResponse({
    description:
      'Authenticated successfully. Returns access token, refresh token, and administrator profile.',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password.' })
  async login(@Body() dto: LoginDto) {
    return await this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Validates refresh token and issues a new pair of JWT tokens.',
  })
  @ApiOkResponse({ description: 'Tokens refreshed successfully.' })
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
  @ApiOkResponse({ description: 'Logged out successfully.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized or token invalid.' })
  async logout(@CurrentUser('id') adminId: string) {
    return await this.authService.logout(adminId);
  }
}
