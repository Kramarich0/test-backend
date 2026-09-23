import { TerminalStatus } from '#generated/prisma/enums.js';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class UpdateTerminalDto {
  @ApiProperty({
    enum: TerminalStatus,
    example: TerminalStatus.ACTIVE,
    description: 'Operational status of the terminal',
  })
  @IsEnum(TerminalStatus)
  status!: TerminalStatus;
}
