import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsStrongPassword, MaxLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'NewSecretPass123!',
    description:
      'New strong password (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 symbol, max 64)',
  })
  @IsString()
  @MaxLength(64)
  @IsStrongPassword(
    { minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 },
    {
      message:
        'New password must be at least 8 characters long and contain uppercase, lowercase, numbers, and symbols',
    },
  )
  newPassword!: string;
}
