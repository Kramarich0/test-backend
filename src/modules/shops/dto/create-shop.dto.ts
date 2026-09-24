import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateShopDto {
  @ApiPropertyOptional({
    example: 'Location No.1 "Sport-Bar Center"',
    description: 'Retail store trade name',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  name?: string;

  @ApiProperty({
    example: 'Tax ID 777777777777, Reg No 321770000000000',
    description: 'Legal and tax requisites',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  requisites!: string;

  @ApiProperty({
    example: 'Moscow, Tverskaya Str., 31',
    description: 'Physical store address',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  address!: string;

  @ApiProperty({
    example: 'shop_tverskaya_01',
    description: 'Unique POS terminal login identifier',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  login!: string;

  @ApiProperty({
    example: 'ShopSecret123!',
    description: 'POS authentication password (min 6 chars, max 64)',
  })
  @IsString()
  @MaxLength(64)
  @MinLength(6)
  password!: string;

  @ApiProperty({
    example: 'f3b07e8a-357c-4ece-9a32-c307eb805f20',
    description: 'UUID of the registered shop owner',
  })
  @IsUUID()
  ownerId!: string;
}
