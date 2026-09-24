import { normalizeMacAddress } from '#common/utils/mac.util.js';
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
    return await this.dbService.terminalRequest.findMany({
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveRequest(id: string) {
    try {
      return await this.dbService.$transaction(async (tx) => {
        const request = await tx.terminalRequest.findUnique({
          where: { id },
        });

        if (!request) {
          throw new NotFoundException('Request not found');
        }

        if (request.status !== 'PENDING') {
          throw new BadRequestException(`Cannot approve a request with status ${request.status}`);
        }

        const { count } = await tx.terminalRequest.updateMany({
          where: { id, status: 'PENDING' },
          data: { status: 'APPROVED' },
        });

        if (count === 0) {
          throw new BadRequestException('Request is no longer in PENDING status');
        }

        const terminal = await tx.terminal.create({
          data: {
            macAddress: normalizeMacAddress(request.macAddress),
            shopId: request.shopId,
            status: 'ACTIVE',
          },
        });

        const updatedRequest = await tx.terminalRequest.findUniqueOrThrow({
          where: { id },
        });

        return { request: updatedRequest, terminal };
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Terminal with this MAC address already exists');
        }
        if (error.code === 'P2025') {
          throw new NotFoundException('Request not found');
        }
      }
      throw error;
    }
  }

  async rejectRequest(id: string) {
    const { count } = await this.dbService.terminalRequest.updateMany({
      where: { id, status: 'PENDING' },
      data: { status: 'REJECTED' },
    });

    if (count === 0) {
      const request = await this.dbService.terminalRequest.findUnique({
        where: { id },
      });

      if (!request) {
        throw new NotFoundException('Request not found');
      }

      throw new BadRequestException(`Cannot reject a request with status ${request.status}`);
    }

    return await this.dbService.terminalRequest.findUniqueOrThrow({
      where: { id },
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
