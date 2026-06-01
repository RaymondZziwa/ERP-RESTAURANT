import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsArray,
  IsOptional,
  IsEnum,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import {
  MealOrderStatus,
  PaymentMethodType,
  PaymentStatus,
} from '@prisma/client';

export class PaymentMethodDto {
  @IsEnum(PaymentMethodType)
  type: PaymentMethodType;

  @IsNumber()
  @Min(0)
  amount: number;
}

export class MealSaleItemDto {
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsNumber()
  @Min(0)
  total: number;

  @IsNumber()
  @IsOptional()
  unitId?: number;
}

export class CreateMealSaleDto {
  @IsOptional()
  @IsNumber()
  tableId?: number;

  @IsEnum(MealOrderStatus)
  @IsOptional()
  saleStatus?: MealOrderStatus;

  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsNumber()
  total: number;

  @IsNumber()
  balance: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MealSaleItemDto)
  items: MealSaleItemDto[];

  @IsNumber()
  @IsNotEmpty()
  servedBy: number;
}

export class UpdateMealSaleDto extends PartialType(CreateMealSaleDto) {}
