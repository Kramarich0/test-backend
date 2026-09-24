import { Module } from '@nestjs/common';
import { ShopOwnersController } from './shop-owners.controller.js';
import { ShopOwnersService } from './shop-owners.service.js';

@Module({
  providers: [ShopOwnersService],
  controllers: [ShopOwnersController],
})
export class ShopOwnersModule {}
