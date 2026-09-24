import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { RolesGuard } from './common/guards/roles.guard.js';
import { validate } from './config/env.validation.js';
import { DBModule } from './db/db.module.js';
import { AdminsModule } from './modules/admins/admins.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ProfileModule } from './modules/profile/profile.module.js';
import { RequestsModule } from './modules/requests/requests.module.js';
import { ShopOwnersModule } from './modules/shop-owners/shop-owners.module.js';
import { ShopsModule } from './modules/shops/shops.module.js';
import { TerminalsModule } from './modules/terminals/terminals.module.js';

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
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
