import { Module } from '@nestjs/common';
import { RequestsController } from './requests.controller.js';
import { RequestsService } from './requests.service.js';

@Module({
  providers: [RequestsService],
  controllers: [RequestsController],
})
export class RequestsModule {}
