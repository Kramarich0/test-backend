import { hashPassword } from '#common/utils/hash.util.js';
import { DBService } from '#db/db.service.js';
import { Prisma } from '#generated/prisma/client.js';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ChangePasswordDto } from '#common/dto/change-password.dto.js';
import type { CreateManagerDto } from './dto/create-manager.dto.js';

@Injectable()
export class AdminsService {
  constructor(private readonly dbService: DBService) {}

  async listAdmins() {
    return await this.dbService.admin.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createManager(dto: CreateManagerDto) {
    const existing = await this.dbService.admin.findUnique({
      where: {
        email: dto.email,
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('Admin with that email address already exists');
    }

    const passwordHash = await hashPassword(dto.password);

    try {
      return await this.dbService.admin.create({
        data: {
          name: dto.name,
          password: passwordHash,
          email: dto.email,
          role: 'MANAGER',
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Admin with that email address already exists');
      }
      throw error;
    }
  }

  async changePassword(adminId: string, dto: ChangePasswordDto) {
    const newPasswordHash = await hashPassword(dto.newPassword);

    try {
      return await this.dbService.admin.update({
        where: {
          id: adminId,
        },
        data: {
          password: newPasswordHash,
          tokenV: { increment: 1 },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Admin not found');
      }
      throw error;
    }
  }

  async deleteAdmin(adminId: string) {
    const admin = await this.dbService.admin.findUnique({
      where: {
        id: adminId,
      },
      select: { role: true },
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    if (admin.role === 'ROOT') {
      throw new BadRequestException('You cannot remove the root admin');
    }

    try {
      return await this.dbService.admin.delete({
        where: {
          id: adminId,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Admin not found');
      }
      throw error;
    }
  }
}
