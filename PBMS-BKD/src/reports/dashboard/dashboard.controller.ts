import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('api/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('metrics')
  async getMetrics() {
    return this.dashboardService.getDashboardMetrics();
  }

  // @Get('employee-metrics')
  // async getEmployeeMetrics(
  //   @Query('storeId') storeId?: string,
  //   @Query('branchId') branchId?: string,
  //   @Query('salesDays') salesDays?: string,
  //   @Query('expenseDays') expenseDays?: string,
  // ) {
  //   return this.dashboardService.getEmployeeDashboardMetrics({
  //     storeId: storeId ? Number(storeId) : undefined,
  //     branchId: branchId ? Number(branchId) : undefined,
  //     salesDays: salesDays ? Number(salesDays) : undefined,
  //     expenseDays: expenseDays ? Number(expenseDays) : undefined,
  //   });
  // }
}
