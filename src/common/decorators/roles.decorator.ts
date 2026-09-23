import type { Role } from '#generated/prisma/enums.js';
import { RolesGuard } from '#common/guards/roles.guard.js';
import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ROLES_KEY } from '../constants/roles.constant.js';

export function Auth(...roles: Role[]) {
  return applyDecorators(
    SetMetadata(ROLES_KEY, roles),
    UseGuards(AuthGuard('jwt'), RolesGuard),
    ApiBearerAuth(),
  );
}
