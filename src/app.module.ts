import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validate } from './config/env.validation.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DBModule } from './db/db.module.js';
import { AdminsModule } from './modules/admins/admins.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ShopOwnersModule } from './modules/shop-owners/shop-owners.module.js';
import { ShopsModule } from './modules/shops/shops.module.js';
import { TerminalsModule } from './modules/terminals/terminals.module.js';
import { RequestsModule } from './modules/requests/requests.module.js';
import { ProfileModule } from './modules/profile/profile.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate }),
    DBModule,
    AuthModule,
    AdminsModule,
    ShopOwnersModule,
    ShopsModule,
    TerminalsModule,
    RequestsModule,
    ProfileModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
