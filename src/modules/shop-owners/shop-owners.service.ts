import { DBService } from '#db/db.service.js';
import { Prisma } from '#generated/prisma/client.js';
import { Injectable, NotFoundException } from '@nestjs/common';
import type { CreateOwnerDto } from './dto/create-owner.dto.js';
import type { UpdateOwnerDto } from './dto/update-owner.dto.js';

@Injectable()
export class ShopOwnersService {
  constructor(private readonly dbService: DBService) {}

  async getOwners() {
    return await this.dbService.shopOwner.findMany({
      include: {
        _count: {
          select: { shops: true },
        },
      },
    });
  }

  async getOwnerDetails(id: string) {
    const owner = await this.dbService.shopOwner.findUnique({
      where: { id },
      include: {
        shops: true,
      },
    });

    if (!owner) {
      throw new NotFoundException('Shop owner not found');
    }

    return owner;
  }

  async createOwner(dto: CreateOwnerDto) {
    return await this.dbService.shopOwner.create({
      data: {
        name: dto.name,
        contacts: dto.contacts,
      },
    });
  }

  async updateOwner(id: string, dto: UpdateOwnerDto) {
    try {
      return await this.dbService.shopOwner.update({
        where: { id },
        data: {
          name: dto.name,
          contacts: dto.contacts,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Shop owner not found');
      }
      throw error;
    }
  }

  async deleteOwner(id: string) {
    try {
      return await this.dbService.shopOwner.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Shop owner not found');
      }
      throw error;
    }
  }
}
