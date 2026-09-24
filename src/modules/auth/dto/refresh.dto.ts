import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsIn...',
    description: 'JWT refresh token string',
  })
  @IsNotEmpty()
  @IsString()
  refreshToken!: string;
}
