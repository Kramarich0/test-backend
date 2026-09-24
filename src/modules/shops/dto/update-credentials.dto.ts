import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateCredentialsDto {
  @ApiPropertyOptional({
    example: 'shop_tverskaya_new',
    description: 'New unique login',
  })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  login?: string;

  @ApiPropertyOptional({
    example: 'NewShopSecret456!',
    description: 'New POS authentication password (min 6 chars, max 64)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  @MinLength(6)
  password?: string;
}
