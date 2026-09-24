import { Auth } from '#common/decorators/roles.decorator.js';
import { Public } from '#common/decorators/public.decorator.js';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HeartbeatDto } from './dto/heartbeat.dto.js';
import { TerminalDetailsResponseDto } from '#common/dto/response-details.dto.js';
import { TerminalListItemResponseDto, TerminalResponseDto } from '#common/dto/terminal-response.dto.js';
import { UpdateTerminalDto } from './dto/update-terminal.dto.js';
import { TerminalsService } from './terminals.service.js';

@ApiTags('Terminals')
@Controller('terminals')
export class TerminalsController {
  constructor(private readonly terminalsService: TerminalsService) {}

  @Get()
  @Auth()
  @ApiOperation({
    summary: 'List all terminals',
    description: 'Returns all KKM terminals registered in the central system.',
  })
  @ApiOkResponse({
    description: 'List of terminals returned successfully.',
    type: [TerminalListItemResponseDto],
  })
  async getTerminals() {
    return await this.terminalsService.getTerminals();
  }

  @Get(':id')
  @Auth()
  @ApiOperation({
    summary: 'Get terminal details',
    description: 'Returns specific terminal details with attached store.',
  })
  @ApiOkResponse({
    description: 'Terminal details returned successfully.',
    type: TerminalDetailsResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Terminal not found.' })
  async getTerminalDetails(@Param('id', ParseUUIDPipe) id: string) {
    return await this.terminalsService.getTerminalDetails(id);
  }

  @Patch(':id/status')
  @Auth()
  @ApiOperation({
    summary: 'Manually update terminal status',
    description: 'Overrides terminal status (ACTIVE/INACTIVE), useful for maintenance or testing.',
  })
  @ApiOkResponse({
    description: 'Status updated.',
    type: TerminalResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Terminal not found.' })
  async updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTerminalDto) {
    return await this.terminalsService.updateTerminalStatus(id, dto);
  }

  @Post('alive')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Terminal heartbeat ping',
    description: 'Heartbeat signal sent by POS terminal hardware to confirm active connectivity.',
  })
  @ApiOkResponse({
    description: 'Heartbeat acknowledged; status set to ACTIVE.',
    type: TerminalResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Terminal with specified MAC address not found.',
  })
  async heartbeat(@Body() dto: HeartbeatDto) {
    return await this.terminalsService.heartbeat(dto);
  }
}
