import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateManagerDto {
  @ApiProperty({ example: 'alex.manager@kkm.local', description: 'Unique email address' })
  @IsEmail()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @ApiProperty({ example: 'Alex Manager', description: 'Full name' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  name!: string;

  @ApiProperty({
    example: 'ManagerPass123!',
    description:
      'Strong password (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 symbol, max 64)',
  })
  @IsString()
  @MaxLength(64)
  @IsStrongPassword(
    { minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 },
    {
      message:
        'Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and symbols',
    },
  )
  password!: string;
}
