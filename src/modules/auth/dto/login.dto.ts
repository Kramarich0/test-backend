import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'root@kkm.local', description: 'Administrator email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'RootAdmin123!', description: 'Administrator password' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
