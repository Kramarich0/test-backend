import { hashPassword } from '#common/utils/hash.util.js';
import { DBService } from '#db/db.service.js';
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
    const owner = await this.dbService.shopOwner.findUnique({
      where: { id: dto.ownerId },
    });
    if (!owner) {
      throw new NotFoundException('The specified shop owner was not found');
    }

    const existingShop = await this.dbService.shop.findUnique({
      where: { login: dto.login },
    });
    if (existingShop) {
      throw new ConflictException('A shop with this login already exists');
    }

    const passwordHash = await hashPassword(dto.password);

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
  }

  async updateCredentials(shopId: string, dto: UpdateCredentialsDto) {
    const shop = await this.dbService.shop.findUnique({
      where: { id: shopId },
      select: { login: true },
    });

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    if (!dto.login && !dto.password) {
      throw new BadRequestException('Provide a new login or password');
    }

    if (dto.login && dto.login !== shop.login) {
      const existing = await this.dbService.shop.findUnique({
        where: { login: dto.login },
      });
      if (existing) {
        throw new ConflictException('A shop with this login already exists');
      }
    }

    const dataToUpdate: {
      login?: string;
      password?: string;
      tokenV: { increment: number };
    } = {
      tokenV: { increment: 1 },
    };

    if (dto.login) {
      dataToUpdate.login = dto.login;
    }

    if (dto.password) {
      dataToUpdate.password = await hashPassword(dto.password);
    }

    return await this.dbService.shop.update({
      where: { id: shopId },
      data: dataToUpdate,
    });
  }
}
