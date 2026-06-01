import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CollectCreditPaymentDto } from 'src/dto/pos.dto';
import { CreateMealSaleDto, UpdateMealSaleDto } from 'src/dto/meal.dto';
import { MealSalesService } from './meal.service';
import { CollectMealPaymentDto } from 'src/dto/collectMealPayment.dto';

@Controller('api/meal-sales')
export class MealSalesController {
  constructor(private readonly salesService: MealSalesService) {}

  @Post('create')
  async create(@Body() createSaleDto: CreateMealSaleDto) {
    return this.salesService.create(createSaleDto);
  }

  @Post('credit-payment')
  async collectCreditPayment(@Body() dto: CollectCreditPaymentDto) {
    return this.salesService.collectCreditPayment(dto);
  }

  @Get('fetch-all')
  async findAll() {
    return this.salesService.findAll();
  }

  @Get('fetch/:id')
  async findOne(@Param('id') id: string) {
    return this.salesService.findOne(Number(id));
  }

  @Put('modify/:id')
  async update(
    @Param('id') id: string,
    @Body() updateSaleDto: UpdateMealSaleDto,
  ) {
    return this.salesService.update(Number(id), updateSaleDto);
  }

  @Put('cancel/:id')
  async cancel(@Param('id') id: string) {
    return this.salesService.cancel(Number(id));
  }

  @Delete('delete/:id')
  async remove(@Param('id') id: string) {
    return this.salesService.remove(Number(id));
  }

  @Get('fetch-pending-bills/:id')
  async GetEmployeePendingBills(@Param('id') id: string) {
    return this.salesService.fetchPendingBillsByEmployee(Number(id));
  }

  @Post('collect-payment')
  async collectPayment(@Body() dto: CollectMealPaymentDto) {
    return this.salesService.collectPayment(
      dto.saleId,
      dto.amountPaid,
      dto.paymentMethod,
      dto.phoneNumber,
    );
  }

  @Get('fetch-past-bills/:id')
  async GetEmployeePastBills(@Param('id') id: string) {
    return this.salesService.getEmployeePastBills(Number(id));
  }

  @Get('order-history')
  async getOrderHistory() {
    return this.salesService.getOrderHistory();
  }

  @Get('fetch-pending-bills')
  async getPendingOrders() {
    return this.salesService.getPendingOrders();
  }
}
