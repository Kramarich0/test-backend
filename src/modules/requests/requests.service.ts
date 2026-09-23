import { DBService } from '#db/db.service.js';
import { Prisma } from '#generated/prisma/client.js';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AddCommentDto } from './dto/add-comment.dto.js';

@Injectable()
export class RequestsService {
  constructor(private readonly dbService: DBService) {}

  async getRequests() {
    return await this.dbService.terminalRequest.findMany();
  }

  async approveRequest(id: string) {
    const request = await this.dbService.terminalRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException(`Cannot approve a request with status ${request.status}`);
    }

    const existingTerminal = await this.dbService.terminal.findUnique({
      where: { macAddress: request.macAddress },
    });

    if (existingTerminal) {
      throw new ConflictException(`Terminal with MAC address ${request.macAddress} already exists`);
    }

    return await this.dbService.$transaction(async (tx) => {
      const updatedRequest = await tx.terminalRequest.update({
        where: { id },
        data: { status: 'APPROVED' },
      });

      const terminal = await tx.terminal.create({
        data: {
          macAddress: request.macAddress,
          shopId: request.shopId,
          status: 'ACTIVE',
        },
      });

      return { request: updatedRequest, terminal };
    });
  }

  async rejectRequest(id: string) {
    const request = await this.dbService.terminalRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException(`Cannot reject a request with status ${request.status}`);
    }

    return await this.dbService.terminalRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
      },
    });
  }

  async addComment(id: string, dto: AddCommentDto) {
    try {
      return await this.dbService.terminalRequest.update({
        where: { id },
        data: { comment: dto.comment },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Request not found');
      }
      throw error;
    }
  }
}
