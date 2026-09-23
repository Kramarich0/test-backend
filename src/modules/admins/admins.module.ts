import { DBModule } from '#db/db.module.js';
import { Module } from '@nestjs/common';
import { AdminsController } from './admins.controller.js';
import { AdminsService } from './admins.service.js';

@Module({
  imports: [DBModule],
  providers: [AdminsService],
  controllers: [AdminsController],
})
export class AdminsModule {}
