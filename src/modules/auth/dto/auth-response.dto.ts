import { ApiProperty } from '@nestjs/swagger';
import { AdminProfileResponseDto } from '#common/dto/admin-profile-response.dto.js';

export class LoginResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsIn...' })
  accessToken!: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsIn...' })
  refreshToken!: string;

  @ApiProperty({ type: () => AdminProfileResponseDto })
  admin!: AdminProfileResponseDto;
}

export class RefreshResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsIn...' })
  accessToken!: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsIn...' })
  refreshToken!: string;
}

export class LogoutResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;
}