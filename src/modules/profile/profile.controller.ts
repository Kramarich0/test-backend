import { CurrentUser } from '#common/decorators/current-user.decorator.js';
import { Auth } from '#common/decorators/roles.decorator.js';
import { Body, Controller, Patch } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { ChangePasswordDto } from './dto/change-password.dto.js';
import { ProfileService } from './profile.service.js';

@ApiTags('Profile')
@Auth()
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Patch('password')
  @ApiOperation({
    summary: 'Change current user password',
    description:
      'Updates password for the currently authenticated administrator extracted from JWT payload.',
  })
  @ApiOkResponse({ description: 'Password updated successfully and active session bumped.' })
  @ApiNotFoundResponse({ description: 'User profile not found.' })
  async changeMyPassword(@CurrentUser('id') currentUserId: string, @Body() dto: ChangePasswordDto) {
    return await this.profileService.changePassword(currentUserId, dto);
  }
}
