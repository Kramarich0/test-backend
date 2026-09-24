import { RequestStatus, TerminalStatus } from '#generated/prisma/enums.js';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RequestShopSummaryDto {
  @ApiProperty({ example: 'f3b07e8a-357c-4ece-9a32-c307eb805f20' })
  id!: string;

  @ApiProperty({ example: 'Location No.1 "Sport-Bar Center"' })
  name!: string | null;

  @ApiProperty({ example: 'Moscow, Tverskaya Str., 31' })
  address!: string;
}

export class ProvisionedTerminalDto {
  @ApiProperty({ example: 'f3b07e8a-357c-4ece-9a32-c307eb805f20' })
  id!: string;

  @ApiProperty({ example: 'AA:BB:CC:DD:EE:01' })
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

export class TerminalRequestResponseDto {
  @ApiProperty({ example: 'f3b07e8a-357c-4ece-9a32-c307eb805f20' })
  id!: string;

  @ApiProperty({ example: 'AA:BB:CC:DD:EE:01' })
  macAddress!: string;

  @ApiProperty({ enum: RequestStatus, example: RequestStatus.PENDING })
  status!: RequestStatus;

  @ApiPropertyOptional({ example: 'Approved by regional security director' })
  comment!: string | null;

  @ApiProperty({ example: 'f3b07e8a-357c-4ece-9a32-c307eb805f20' })
  shopId!: string;

  @ApiProperty({ example: '2026-09-24T10:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-09-24T10:00:00.000Z' })
  updatedAt!: Date;
}

export class TerminalRequestListItemResponseDto extends TerminalRequestResponseDto {
  @ApiProperty({ type: () => RequestShopSummaryDto })
  shop!: RequestShopSummaryDto;
}

export class ApproveRequestResponseDto {
  @ApiProperty({ type: () => TerminalRequestResponseDto })
  request!: TerminalRequestResponseDto;

  @ApiProperty({ type: () => ProvisionedTerminalDto })
  terminal!: ProvisionedTerminalDto;
}
