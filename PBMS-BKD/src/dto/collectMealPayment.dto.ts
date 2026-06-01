import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CollectMealPaymentDto {
  @IsNumber()
  @IsNotEmpty()
  saleId!: number;

  @IsString()
  paymentMethod!: string;

  @IsNumber()
  @Min(0)
  amountPaid!: number;

  phoneNumber?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
