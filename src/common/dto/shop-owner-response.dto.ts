import { ApiProperty } from '@nestjs/swagger';

export class ShopOwnerCountDto {
  @ApiProperty({ example: 3 })
  shops!: number;
}

export class ShopOwnerListItemResponseDto {
  @ApiProperty({ example: 'f3b07e8a-357c-4ece-9a32-c307eb805f20' })
  id!: string;

  @ApiProperty({ example: 'IE Ivanov Ivan Ivanovich' })
  name!: string;

  @ApiProperty({ example: '+7 (999) 123-45-67, ivanov@mail.ru' })
  contacts!: string;

  @ApiProperty({ example: '2026-09-24T10:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-09-24T10:00:00.000Z' })
  updatedAt!: Date;

  @ApiProperty({ type: () => ShopOwnerCountDto })
  _count!: ShopOwnerCountDto;
}

export class ShopOwnerResponseDto {
  @ApiProperty({ example: 'f3b07e8a-357c-4ece-9a32-c307eb805f20' })
  id!: string;

  @ApiProperty({ example: 'IE Ivanov Ivan Ivanovich' })
  name!: string;

  @ApiProperty({ example: '+7 (999) 123-45-67, ivanov@mail.ru' })
  contacts!: string;

  @ApiProperty({ example: '2026-09-24T10:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-09-24T10:00:00.000Z' })
  updatedAt!: Date;
}