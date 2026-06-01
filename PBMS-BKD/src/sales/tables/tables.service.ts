import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTableDto, UpdateTableDto } from 'src/dto/table.dto';

import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TablesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTableDto) {
    // Check if a table with the same number already exists
    const existingTable = await this.prisma.tables.findFirst({
      where: {
        number: dto.number,
      },
    });

    if (existingTable) {
      throw new NotFoundException(
        `Table number ${dto.number} already exists. Please use a unique table number.`,
      );
    }

    const table = await this.prisma.tables.create({
      data: dto,
    });

    return {
      data: table,
      message: 'Table created successfully',
      status: 200,
    };
  }

  async findAll() {
    const tables = await this.prisma.tables.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: tables,
      message: 'Tables fetched successfullly',
      status: 200,
    };
  }

  async findOne(id: number) {
    const table = await this.prisma.tables.findUnique({ where: { id } });
    if (!table) throw new NotFoundException(`Table with id ${id} not found`);
    return {
      data: table,
      message: 'Table  fetched successfullly',
      status: 200,
    };
  }

  async update(id: number, dto: UpdateTableDto) {
    await this.findOne(id); // ensures it exists
    const table = await this.prisma.tables.update({
      where: { id },
      data: dto,
    });

    return {
      data: table,
      message: 'Table updated successfullly',
      status: 200,
    };
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.tables.delete({ where: { id } });

    return {
      data: [],
      message: 'Table deleted successfullly',
      status: 200,
    };
  }
}
