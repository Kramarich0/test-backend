import { DBModule } from '#db/db.module.js';
import { Module } from '@nestjs/common';
import { TerminalsController } from './terminals.controller.js';
import { TerminalsService } from './terminals.service.js';

@Module({
  imports: [DBModule],
  providers: [TerminalsService],
  controllers: [TerminalsController],
})
export class TerminalsModule {}
