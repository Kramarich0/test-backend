import { Global, Module } from '@nestjs/common';
import { DBService } from './db.service.js';

@Global()
@Module({
  providers: [DBService],
  exports: [DBService],
})
export class DBModule {}
