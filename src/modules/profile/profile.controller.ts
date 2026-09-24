import { CurrentUser } from '#common/decorators/current-user.decorator.js';
import { Auth } from '#common/decorators/roles.decorator.js';
import { Body, Controller, Patch } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminsService } from '../admins/admins.service.js';
import { AdminProfileResponseDto } from '#common/dto/admin-profile-response.dto.js';
import { ChangePasswordDto } from '#common/dto/change-password.dto.js';

@ApiTags('Profile')
@Auth()
@Controller('profile')
export class ProfileController {
  constructor(private readonly adminsService: AdminsService) {}

  @Patch('password')
  @ApiOperation({
    summary: 'Change current user password',
    description:
      'Updates password for the currently authenticated administrator extracted from JWT payload.',
  })
  @ApiOkResponse({
    description: 'Password updated successfully and active session bumped.',
    type: AdminProfileResponseDto,
  })
  @ApiNotFoundResponse({ description: 'User profile not found.' })
  async changeMyPassword(@CurrentUser('id') currentUserId: string, @Body() dto: ChangePasswordDto) {
    return await this.adminsService.changePassword(currentUserId, dto);
  }
}
