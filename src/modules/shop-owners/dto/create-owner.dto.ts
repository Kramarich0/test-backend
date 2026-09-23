import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateOwnerDto {
  @ApiProperty({
    example: 'IE Ivanov Ivan Ivanovich',
    description: 'Legal name or individual entrepreneur',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    example: '+7 (999) 123-45-67, ivanov@mail.ru',
    description: 'Phone and email contacts',
  })
  @IsString()
  @IsNotEmpty()
  contacts!: string;
}
