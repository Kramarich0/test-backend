import { hashPassword } from '#common/utils/hash.util.js';
import { DBService } from '#db/db.service.js';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ChangePasswordDto } from './dto/change-password.dto.js';
import type { CreateManagerDto } from './dto/create-manager.dto.js';

@Injectable()
export class AdminsService {
  constructor(private readonly dbService: DBService) {}
  async listAdmins() {
    return await this.dbService.admin.findMany();
  }

  async createManager(dto: CreateManagerDto) {
    const existing = await this.dbService.admin.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (existing) {
      throw new ConflictException('Admin with that email address already exists');
    }

    const passwordHash = await hashPassword(dto.password);

    return await this.dbService.admin.create({
      data: {
        name: dto.name,
        password: passwordHash,
        email: dto.email,
        role: 'MANAGER',
      },
    });
  }

  async changePassword(adminId: string, dto: ChangePasswordDto) {
    const admin = await this.dbService.admin.findUnique({
      where: {
        id: adminId,
      },
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    const newPasswordHash = await hashPassword(dto.newPassword);

    return await this.dbService.admin.update({
      where: {
        id: adminId,
      },
      data: {
        password: newPasswordHash,
        tokenV: { increment: 1 },
      },
    });
  }

  async deleteAdmin(adminId: string) {
    const admin = await this.dbService.admin.findUnique({
      where: {
        id: adminId,
      },
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    if (admin.role === 'ROOT') {
      throw new BadRequestException('You cannot remove the root admin');
    }

    return await this.dbService.admin.delete({
      where: {
        id: adminId,
      },
    });
  }
}
