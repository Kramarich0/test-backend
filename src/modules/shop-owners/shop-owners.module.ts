import { DBModule } from '#db/db.module.js';
import { Module } from '@nestjs/common';
import { ShopOwnersController } from './shop-owners.controller.js';
import { ShopOwnersService } from './shop-owners.service.js';

@Module({
  imports: [DBModule],
  providers: [ShopOwnersService],
  controllers: [ShopOwnersController],
})
export class ShopOwnersModule {}
