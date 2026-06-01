import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MealSalesController } from './meal.controller';
import { MealSalesService } from './meal.service';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

@Module({
  controllers: [MealSalesController],
  imports: [ConfigModule, HttpModule],
  providers: [MealSalesService, PrismaService],
})
export class MealPosModule {}
