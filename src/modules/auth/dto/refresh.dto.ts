import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class RefreshDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsIn...',
    description: 'JWT refresh token string',
  })
  @IsNotEmpty()
  refreshToken!: string;
}
