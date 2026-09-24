import type { Role } from '#generated/prisma/enums.js';
import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ROLES_KEY } from '../constants/roles.constant.js';

export function Auth(...roles: Role[]) {
  return applyDecorators(SetMetadata(ROLES_KEY, roles), ApiBearerAuth());
}
