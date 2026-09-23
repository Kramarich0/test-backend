import { DBModule } from '#db/db.module.js';
import { Module } from '@nestjs/common';
import { RequestsController } from './requests.controller.js';
import { RequestsService } from './requests.service.js';

@Module({
  imports: [DBModule],
  providers: [RequestsService],
  controllers: [RequestsController],
})
export class RequestsModule {}
