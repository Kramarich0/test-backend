import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'NewSecretPass123!',
    description: 'New password (non-empty, max 64 chars)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  newPassword!: string;
}
