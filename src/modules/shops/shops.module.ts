import { Module } from '@nestjs/common';
import { ShopsController } from './shops.controller.js';
import { ShopsService } from './shops.service.js';

@Module({
  providers: [ShopsService],
  controllers: [ShopsController],
})
export class ShopsModule {}
