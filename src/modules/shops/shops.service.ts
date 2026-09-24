import { hashPassword } from '#common/utils/hash.util.js';
import { DBService } from '#db/db.service.js';
import { Prisma } from '#generated/prisma/client.js';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CreateShopDto } from './dto/create-shop.dto.js';
import type { UpdateCredentialsDto } from './dto/update-credentials.dto.js';

@Injectable()
export class ShopsService {
  constructor(private readonly dbService: DBService) {}

  async getShops() {
    return await this.dbService.shop.findMany({
      include: {
        owner: {
          select: { id: true, name: true, contacts: true },
        },
        _count: {
          select: { terminals: true, requests: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getShopDetails(id: string) {
    const shop = await this.dbService.shop.findUnique({
      where: { id },
      include: {
        owner: true,
        terminals: true,
        requests: true,
      },
    });

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    return shop;
  }

  async createShop(dto: CreateShopDto) {
    const passwordHash = await hashPassword(dto.password);

    try {
      return await this.dbService.shop.create({
        data: {
          name: dto.name,
          requisites: dto.requisites,
          address: dto.address,
          login: dto.login,
          password: passwordHash,
          ownerId: dto.ownerId,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('A shop with this login already exists');
        }
        if (error.code === 'P2003') {
          throw new NotFoundException('The specified shop owner was not found');
        }
      }
      throw error;
    }
  }

  async updateCredentials(shopId: string, dto: UpdateCredentialsDto) {
    if (!dto.login && !dto.password) {
      throw new BadRequestException('Provide a new login or password');
    }

    const dataToUpdate: Prisma.ShopUpdateInput = {
      tokenV: { increment: 1 },
    };

    if (dto.login) {
      dataToUpdate.login = dto.login;
    }

    if (dto.password) {
      dataToUpdate.password = await hashPassword(dto.password);
    }

    try {
      return await this.dbService.shop.update({
        where: { id: shopId },
        data: dataToUpdate,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('A shop with this login already exists');
        }
        if (error.code === 'P2025') {
          throw new NotFoundException('Shop not found');
        }
      }
      throw error;
    }
  }
}
