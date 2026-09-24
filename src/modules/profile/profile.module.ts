import { Module } from '@nestjs/common';
import { AdminsModule } from '../admins/admins.module.js';
import { ProfileController } from './profile.controller.js';

@Module({
  imports: [AdminsModule],
  controllers: [ProfileController],
})
export class ProfileModule {}
