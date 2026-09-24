import { DBService } from '#db/db.service.js';
import { Prisma } from '#generated/prisma/client.js';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
      orderBy: { createdAt: 'desc' },
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
    if (!dto.name && !dto.contacts) {
      throw new BadRequestException('Provide at least one field to update');
    }

    const data: Prisma.ShopOwnerUpdateInput = {};

    if (dto.name) {
      data.name = dto.name;
    }

    if (dto.contacts) {
      data.contacts = dto.contacts;
    }

    try {
      return await this.dbService.shopOwner.update({
        where: { id },
        data,
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
