import { ApiProperty } from '@nestjs/swagger';
import { TerminalRequestResponseDto } from './request-response.dto.js';
import { ShopOwnerResponseDto } from './shop-owner-response.dto.js';
import { ShopResponseDto } from './shop-response.dto.js';
import { TerminalResponseDto } from './terminal-response.dto.js';

export class ShopDetailsResponseDto extends ShopResponseDto {
  @ApiProperty({ type: () => ShopOwnerResponseDto })
  owner!: ShopOwnerResponseDto;

  @ApiProperty({ type: () => [TerminalResponseDto] })
  terminals!: TerminalResponseDto[];

  @ApiProperty({ type: () => [TerminalRequestResponseDto] })
  requests!: TerminalRequestResponseDto[];
}

export class TerminalDetailsResponseDto extends TerminalResponseDto {
  @ApiProperty({ type: () => ShopResponseDto })
  shop!: ShopResponseDto;
}

export class ShopOwnerDetailsResponseDto extends ShopOwnerResponseDto {
  @ApiProperty({ type: () => [ShopResponseDto] })
  shops!: ShopResponseDto[];
}
