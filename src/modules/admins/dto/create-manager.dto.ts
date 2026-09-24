import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
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

  @ApiProperty({ example: 'ManagerPass123!', description: 'Password (non-empty, max 64 chars)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  password!: string;
}
