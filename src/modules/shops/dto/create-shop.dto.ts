import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsStrongPassword, MaxLength } from 'class-validator';

export class CreateShopDto {
  @ApiPropertyOptional({
    example: 'Location No.1 "Sport-Bar Center"',
    description: 'Retail store trade name',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: 'Tax ID 777777777777, Reg No 321770000000000',
    description: 'Legal and tax requisites',
  })
  @IsString()
  @IsNotEmpty()
  requisites!: string;

  @ApiProperty({
    example: 'Moscow, Tverskaya Str., 31',
    description: 'Physical store address',
  })
  @IsString()
  @IsNotEmpty()
  address!: string;

  @ApiProperty({
    example: 'shop_tverskaya_01',
    description: 'Unique POS terminal login identifier',
  })
  @IsString()
  @IsNotEmpty()
  login!: string;

  @ApiProperty({
    example: 'ShopSecret123!',
    description:
      'POS authentication password (min 6 chars, uppercase, lowercase, number, symbol, max 64)',
  })
  @IsString()
  @MaxLength(64)
  @IsStrongPassword(
    { minLength: 6, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 },
    { message: 'Shop password must contain uppercase, lowercase, numbers, and symbols' },
  )
  password!: string;

  @ApiProperty({
    example: 'f3b07e8a-357c-4ece-9a32-c307eb805f20',
    description: 'UUID of the registered shop owner',
  })
  @IsString()
  @IsNotEmpty()
  ownerId!: string;
}
