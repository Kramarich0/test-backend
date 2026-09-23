import { Auth } from '#common/decorators/roles.decorator.js';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AdminsService } from './admins.service.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { CreateManagerDto } from './dto/create-manager.dto.js';

@ApiTags('Admins')
@Auth('ROOT')
@Controller('admins')
export class AdminsController {
  constructor(private readonly adminService: AdminsService) {}

  @Get()
  @ApiOperation({
    summary: 'List all administrators (Root only)',
    description: 'Retrieves a list of all administrators registered in Central Office.',
  })
  @ApiOkResponse({ description: 'List of administrators returned successfully.' })
  async getAdmins() {
    return await this.adminService.listAdmins();
  }

  @Post()
  @ApiOperation({
    summary: 'Create manager (Root only)',
    description: 'Creates a new administrator strictly with the MANAGER role.',
  })
  @ApiCreatedResponse({ description: 'Manager created successfully.' })
  @ApiConflictResponse({
    description: 'Administrator with this email already exists.',
  })
  async createManager(@Body() dto: CreateManagerDto) {
    return await this.adminService.createManager(dto);
  }

  @Patch(':id/password')
  @ApiOperation({
    summary: 'Change administrator password (Root only)',
    description: 'Updates administrator password and terminates their active session.',
  })
  @ApiOkResponse({ description: 'Password changed successfully.' })
  @ApiNotFoundResponse({ description: 'Administrator not found.' })
  async changePassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return await this.adminService.changePassword(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete administrator (Root only)',
    description: 'Deletes manager account. Prevents deletion of the ROOT administrator.',
  })
  @ApiOkResponse({ description: 'Administrator deleted successfully.' })
  @ApiBadRequestResponse({ description: 'Cannot delete the ROOT administrator.' })
  @ApiNotFoundResponse({ description: 'Administrator not found.' })
  async deleteAdmin(@Param('id', ParseUUIDPipe) id: string) {
    return await this.adminService.deleteAdmin(id);
  }
}
