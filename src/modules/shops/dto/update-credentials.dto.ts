import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsStrongPassword, MaxLength } from 'class-validator';

export class UpdateCredentialsDto {
  @ApiPropertyOptional({
    example: 'shop_tverskaya_new',
    description: 'New unique login',
  })
  @IsOptional()
  @IsString()
  login?: string;

  @ApiPropertyOptional({
    example: 'NewShopSecret456!',
    description: 'New POS authentication password (min 6 chars, max 64)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  @IsStrongPassword(
    { minLength: 6, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 },
    { message: 'New shop password must contain uppercase, lowercase, numbers, and symbols' },
  )
  password?: string;
}
