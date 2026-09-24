import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'root@kkm.local', description: 'Administrator email' })
  @IsEmail()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @ApiProperty({ example: 'RootAdmin123!', description: 'Administrator password' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  password!: string;
}
