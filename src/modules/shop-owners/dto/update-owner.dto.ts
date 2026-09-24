import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateOwnerDto {
  @ApiPropertyOptional({
    example: 'IE Ivanov Ivan Ivanovich',
    description: 'Updated legal name',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ example: '+7 (999) 000-11-22', description: 'Updated contacts' })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  contacts?: string;
}
