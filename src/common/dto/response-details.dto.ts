import { ApiProperty } from '@nestjs/swagger';
import { ShopOwnerResponseDto } from './shop-owner-response.dto.js';
import { TerminalRequestResponseDto } from './request-response.dto.js';
import { ShopResponseDto } from './shop-response.dto.js';
import { TerminalResponseDto } from './terminal-response.dto.js';

/**
 * Composite response schemas for detail endpoints (:id).
 *
 * Shared contracts live in the common (leaf) layer — same as the plain
 * response DTOs they compose — so modules never import each other's
 * internals: the VSA architecture rule (`vsa-no-cross-slice-imports`) only
 * forbids module-to-module imports, while this file composes public response
 * shapes for Swagger documentation from other common DTOs.
 */
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
