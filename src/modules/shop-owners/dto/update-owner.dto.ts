import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateOwnerDto {
  @ApiPropertyOptional({
    example: 'IE Ivanov Ivan Ivanovich',
    description: 'Updated legal name',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '+7 (999) 000-11-22', description: 'Updated contacts' })
  @IsOptional()
  @IsString()
  contacts?: string;
}
