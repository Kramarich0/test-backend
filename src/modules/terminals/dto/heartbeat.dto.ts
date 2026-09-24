import { normalizeMacAddress } from '#common/utils/mac.util.js';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsMACAddress } from 'class-validator';

export class HeartbeatDto {
  @ApiProperty({
    example: '00:1B:44:11:3A:B7',
    description: 'Hardware MAC address of the KKM terminal',
  })
  @IsMACAddress()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizeMacAddress(value) : value,
  )
  macAddress!: string;
}
