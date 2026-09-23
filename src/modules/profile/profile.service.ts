import { hashPassword } from '#common/utils/hash.util.js';
import { DBService } from '#db/db.service.js';
import { Injectable, NotFoundException } from '@nestjs/common';
import type { ChangePasswordDto } from './dto/change-password.dto.js';

@Injectable()
export class ProfileService {
  constructor(private readonly dbService: DBService) {}

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const admin = await this.dbService.admin.findUnique({
      where: { id: userId },
    });

    if (!admin) {
      throw new NotFoundException('User not found');
    }

    const newPasswordHash = await hashPassword(dto.newPassword);

    return await this.dbService.admin.update({
      where: { id: userId },
      data: {
        password: newPasswordHash,
        tokenV: { increment: 1 },
      },
    });
  }
}
