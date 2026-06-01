import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TablesController } from './tables.controller';
import { TablesService } from './tables.service';

@Module({
  controllers: [TablesController],
  providers: [TablesService, PrismaService],
})
export class TablesModule {}
