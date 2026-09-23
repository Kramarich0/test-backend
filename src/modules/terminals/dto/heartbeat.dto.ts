import { ApiProperty } from '@nestjs/swagger';
import { IsMACAddress } from 'class-validator';

export class HeartbeatDto {
  @ApiProperty({
    example: '00:1B:44:11:3A:B7',
    description: 'Hardware MAC address of the KKM terminal',
  })
  @IsMACAddress()
  macAddress!: string;
}
