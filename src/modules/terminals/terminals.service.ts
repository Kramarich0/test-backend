import { DBService } from '#db/db.service.js';
import { Prisma } from '#generated/prisma/client.js';
import { Injectable, NotFoundException } from '@nestjs/common';
import type { HeartbeatDto } from './dto/heartbeat.dto.js';
import type { UpdateTerminalDto } from './dto/update-terminal.dto.js';

@Injectable()
export class TerminalsService {
  constructor(private readonly dbService: DBService) {}

  async getTerminals() {
    return await this.dbService.terminal.findMany();
  }

  async getTerminalDetails(id: string) {
    const terminal = await this.dbService.terminal.findUnique({
      where: { id },
      include: {
        shop: true,
      },
    });

    if (!terminal) {
      throw new NotFoundException('Terminal not found');
    }

    return terminal;
  }

  async updateTerminalStatus(id: string, dto: UpdateTerminalDto) {
    try {
      return await this.dbService.terminal.update({
        where: { id },
        data: { status: dto.status },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Terminal not found');
      }
      throw error;
    }
  }

  async heartbeat(dto: HeartbeatDto) {
    try {
      return await this.dbService.terminal.update({
        where: { macAddress: dto.macAddress },
        data: { status: 'ACTIVE' },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('No terminal with such MAC address is registered');
      }
      throw error;
    }
  }
}
