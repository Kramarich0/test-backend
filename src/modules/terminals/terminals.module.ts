import { Module } from '@nestjs/common';
import { TerminalsController } from './terminals.controller.js';
import { TerminalsService } from './terminals.service.js';

@Module({
  providers: [TerminalsService],
  controllers: [TerminalsController],
})
export class TerminalsModule {}
