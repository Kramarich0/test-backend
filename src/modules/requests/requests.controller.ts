import { Auth } from '#common/decorators/roles.decorator.js';
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
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AddCommentDto } from './dto/add-comment.dto.js';
import {
  ApproveRequestResponseDto,
  TerminalRequestListItemResponseDto,
  TerminalRequestResponseDto,
} from '#common/dto/request-response.dto.js';
import { RequestsService } from './requests.service.js';

@ApiTags('Terminal Requests')
@Auth()
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get()
  @ApiOperation({
    summary: 'List connection requests',
    description: 'Lists all pending, approved, or rejected terminal requests.',
  })
  @ApiOkResponse({
    description: 'List of connection requests returned successfully.',
    type: [TerminalRequestListItemResponseDto],
  })
  async getRequests() {
    return await this.requestsService.getRequests();
  }

  @Patch(':id/approve')
  @ApiOperation({
    summary: 'Approve request and create terminal',
    description:
      'Atomically marks request as APPROVED and provisions an ACTIVE terminal in a single database transaction.',
  })
  @ApiOkResponse({
    description: 'Request approved and terminal provisioned.',
    type: ApproveRequestResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Request is not in PENDING state.' })
  @ApiNotFoundResponse({ description: 'Request not found.' })
  async approveRequest(@Param('id', ParseUUIDPipe) id: string) {
    return await this.requestsService.approveRequest(id);
  }

  @Patch(':id/reject')
  @ApiBadRequestResponse({ description: 'Request is not in PENDING state.' })
  @ApiOperation({
    summary: 'Reject connection request',
    description: 'Marks request status as REJECTED.',
  })
  @ApiOkResponse({
    description: 'Request rejected.',
    type: TerminalRequestResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Request not found.' })
  async rejectRequest(@Param('id', ParseUUIDPipe) id: string) {
    return await this.requestsService.rejectRequest(id);
  }

  @Post(':id/comment')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Add comment to request',
    description: 'Attaches an internal operator comment to the connection request.',
  })
  @ApiOkResponse({
    description: 'Comment saved.',
    type: TerminalRequestResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Request not found.' })
  async addComment(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddCommentDto) {
    return await this.requestsService.addComment(id, dto);
  }
}
