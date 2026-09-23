import { DBModule } from '#db/db.module.js';
import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller.js';
import { ProfileService } from './profile.service.js';

@Module({
  imports: [DBModule],
  providers: [ProfileService],
  controllers: [ProfileController],
})
export class ProfileModule {}
