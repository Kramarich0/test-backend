import { Role } from '#generated/prisma/enums.js';
import { ApiProperty } from '@nestjs/swagger';

export class AdminProfileResponseDto {
  @ApiProperty({ example: 'f3b07e8a-357c-4ece-9a32-c307eb805f20' })
  id!: string;

  @ApiProperty({ example: 'alex.manager@kkm.local' })
  email!: string;

  @ApiProperty({ example: 'Alex Manager' })
  name!: string;

  @ApiProperty({ enum: Role, example: Role.MANAGER })
  role!: Role;

  @ApiProperty({ example: '2026-09-24T10:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-09-24T10:00:00.000Z' })
  updatedAt!: Date;
}
