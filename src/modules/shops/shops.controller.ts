import { Auth } from '#common/decorators/roles.decorator.js';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateShopDto } from './dto/create-shop.dto.js';
import { UpdateCredentialsDto } from './dto/update-credentials.dto.js';
import { ShopsService } from './shops.service.js';

@ApiTags('Shops')
@Auth()
@Controller('shops')
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Get()
  @ApiOperation({
    summary: 'List all shops',
    description: 'Returns all retail shops with owner information and terminal counts.',
  })
  @ApiOkResponse({ description: 'List of shops returned successfully.' })
  async getShops() {
    return await this.shopsService.getShops();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get shop details',
    description:
      'Returns full shop information including owner, active terminals, and connection requests.',
  })
  @ApiOkResponse({ description: 'Shop details returned successfully.' })
  @ApiNotFoundResponse({ description: 'Shop not found.' })
  async getShopDetails(@Param('id', ParseUUIDPipe) id: string) {
    return await this.shopsService.getShopDetails(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create retail shop',
    description: 'Registers a new shop linked to an existing owner.',
  })
  @ApiCreatedResponse({ description: 'Shop created.' })
  @ApiNotFoundResponse({ description: 'Owner not found.' })
  @ApiConflictResponse({ description: 'Shop login already in use.' })
  async createShop(@Body() dto: CreateShopDto) {
    return await this.shopsService.createShop(dto);
  }

  @Patch(':id/credentials')
  @ApiOperation({
    summary: 'Update shop credentials and terminate sessions',
    description:
      'Updates POS terminal login/password and increments token version to disconnect active devices.',
  })
  @ApiOkResponse({ description: 'Credentials updated and sessions terminated.' })
  @ApiNotFoundResponse({ description: 'Shop not found.' })
  @ApiConflictResponse({ description: 'New login is already taken.' })
  async updateCredentials(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCredentialsDto) {
    return await this.shopsService.updateCredentials(id, dto);
  }
}
