import { Auth } from '#common/decorators/roles.decorator.js';
import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateOwnerDto } from './dto/create-owner.dto.js';
import { UpdateOwnerDto } from './dto/update-owner.dto.js';
import { ShopOwnersService } from './shop-owners.service.js';

@ApiTags('Shop Owners')
@Auth()
@Controller('shops-owners')
export class ShopOwnersController {
  constructor(private readonly shopOwnersService: ShopOwnersService) {}

  @Get()
  @ApiOperation({
    summary: 'List all shop owners',
    description: 'Returns all registered shop owners along with their shop counts.',
  })
  @ApiOkResponse({ description: 'List of shop owners returned successfully.' })
  async getOwners() {
    return await this.shopOwnersService.getOwners();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get shop owner details',
    description: 'Returns complete shop owner profile including associated retail shops.',
  })
  @ApiOkResponse({ description: 'Shop owner details returned successfully.' })
  @ApiNotFoundResponse({ description: 'Shop owner not found.' })
  async getOwnerDetails(@Param('id', ParseUUIDPipe) id: string) {
    return await this.shopOwnersService.getOwnerDetails(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create shop owner',
    description: 'Registers a new individual entrepreneur or legal entity.',
  })
  @ApiCreatedResponse({ description: 'Shop owner registered successfully.' })
  async createOwner(@Body() dto: CreateOwnerDto) {
    return await this.shopOwnersService.createOwner(dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update shop owner',
    description: 'Updates name or contacts for a shop owner.',
  })
  @ApiOkResponse({ description: 'Shop owner updated successfully.' })
  @ApiNotFoundResponse({ description: 'Shop owner not found.' })
  async updateOwner(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateOwnerDto) {
    return await this.shopOwnersService.updateOwner(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete shop owner',
    description: 'Removes shop owner and cascades to owned shops and terminals.',
  })
  @ApiOkResponse({ description: 'Shop owner deleted successfully.' })
  @ApiNotFoundResponse({ description: 'Shop owner not found.' })
  async deleteOwner(@Param('id', ParseUUIDPipe) id: string) {
    return await this.shopOwnersService.deleteOwner(id);
  }
}
