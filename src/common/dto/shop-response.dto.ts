import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ShopCountsDto {
  @ApiProperty({ example: 2 })
  terminals!: number;

  @ApiProperty({ example: 1 })
  requests!: number;
}

export class ShopOwnerSummaryDto {
  @ApiProperty({ example: 'f3b07e8a-357c-4ece-9a32-c307eb805f20' })
  id!: string;

  @ApiProperty({ example: 'IE Ivanov Ivan Ivanovich' })
  name!: string;

  @ApiProperty({ example: '+7 (999) 123-45-67, ivanov@mail.ru' })
  contacts!: string;
}

export class ShopListItemResponseDto {
  @ApiProperty({ example: 'f3b07e8a-357c-4ece-9a32-c307eb805f20' })
  id!: string;

  @ApiPropertyOptional({ example: 'Location No.1 "Sport-Bar Center"' })
  name?: string | null;

  @ApiProperty({ example: 'Tax ID 777777777777, Reg No 321770000000000' })
  requisites!: string;

  @ApiProperty({ example: 'Moscow, Tverskaya Str., 31' })
  address!: string;

  @ApiProperty({ example: 'shop_tverskaya_01' })
  login!: string;

  @ApiProperty({ example: 'f3b07e8a-357c-4ece-9a32-c307eb805f20' })
  ownerId!: string;

  @ApiProperty({ example: '2026-09-24T10:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-09-24T10:00:00.000Z' })
  updatedAt!: Date;

  @ApiProperty({ type: () => ShopOwnerSummaryDto })
  owner!: ShopOwnerSummaryDto;

  @ApiProperty({ type: () => ShopCountsDto })
  _count!: ShopCountsDto;
}

export class ShopResponseDto {
  @ApiProperty({ example: 'f3b07e8a-357c-4ece-9a32-c307eb805f20' })
  id!: string;

  @ApiPropertyOptional({ example: 'Location No.1 "Sport-Bar Center"' })
  name?: string | null;

  @ApiProperty({ example: 'Tax ID 777777777777, Reg No 321770000000000' })
  requisites!: string;

  @ApiProperty({ example: 'Moscow, Tverskaya Str., 31' })
  address!: string;

  @ApiProperty({ example: 'shop_tverskaya_01' })
  login!: string;

  @ApiProperty({ example: 'f3b07e8a-357c-4ece-9a32-c307eb805f20' })
  ownerId!: string;

  @ApiProperty({ example: '2026-09-24T10:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-09-24T10:00:00.000Z' })
  updatedAt!: Date;
}
