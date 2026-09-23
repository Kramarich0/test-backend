import { PrismaClient } from '#generated/prisma/client.js';
import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';

@Injectable()
export class DBService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      omit: {
        admin: {
          password: true,
        },
        shop: {
          password: true,
        },
      },
    });
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }

  async onModuleInit() {
    await this.$connect();
  }
}
