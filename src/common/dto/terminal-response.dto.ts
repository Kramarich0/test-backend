import { TerminalStatus } from '#generated/prisma/enums.js';
import { ApiProperty } from '@nestjs/swagger';

export class TerminalShopSummaryDto {
  @ApiProperty({ example: 'f3b07e8a-357c-4ece-9a32-c307eb805f20' })
  id!: string;

  @ApiProperty({ example: 'Location No.1 "Sport-Bar Center"' })
  name!: string | null;

  @ApiProperty({ example: 'Moscow, Tverskaya Str., 31' })
  address!: string;
}

export class TerminalListItemResponseDto {
  @ApiProperty({ example: 'f3b07e8a-357c-4ece-9a32-c307eb805f20' })
  id!: string;

  @ApiProperty({ example: '00:1B:44:11:3A:B7' })
  macAddress!: string;

  @ApiProperty({ enum: TerminalStatus, example: TerminalStatus.ACTIVE })
  status!: TerminalStatus;

  @ApiProperty({ example: 'f3b07e8a-357c-4ece-9a32-c307eb805f20' })
  shopId!: string;

  @ApiProperty({ example: '2026-09-24T10:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-09-24T10:00:00.000Z' })
  updatedAt!: Date;

  @ApiProperty({ type: () => TerminalShopSummaryDto })
  shop!: TerminalShopSummaryDto;
}

export class TerminalResponseDto {
  @ApiProperty({ example: 'f3b07e8a-357c-4ece-9a32-c307eb805f20' })
  id!: string;

  @ApiProperty({ example: '00:1B:44:11:3A:B7' })
  macAddress!: string;

  @ApiProperty({ enum: TerminalStatus, example: TerminalStatus.ACTIVE })
  status!: TerminalStatus;

  @ApiProperty({ example: 'f3b07e8a-357c-4ece-9a32-c307eb805f20' })
  shopId!: string;

  @ApiProperty({ example: '2026-09-24T10:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-09-24T10:00:00.000Z' })
  updatedAt!: Date;
}