import type { Admin } from '#generated/prisma/client.js';
import type { Role } from '#generated/prisma/enums.js';

export type SafeAdmin = Omit<Admin, 'password'>;

export type JwtPayload = {
  sub: string;
  email: string;
  role: Role;
  tokenV: number;
};
