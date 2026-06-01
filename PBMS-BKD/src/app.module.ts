import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { BranchModule } from './branches/branch.module';
import { PrismaModule } from './prisma/prisma.module';
import { RoleModule } from './roles/roles.module';
import { CompanyModule } from './company-profile/profile.module';
import { EventsModule } from './event/event.module';
import { ExhibitionModule } from './exhibition/exhibition.module';
import { BankModule } from './chequeMgt/banks/bank.module';
import { ChequeModule } from './chequeMgt/chequeMgt/chequeMgt.module';
import { HumanResourceModule } from './humanResource/humanResource.module';
import { AuthModule } from './auth/auth.module';
import { InventoryModule } from './inventory/inventory.module';
import { ProjectsModule } from './projects/projects.module';
import { BranchExpenseModule } from './expenses/expenses.module';
import { PosModule } from './sales/pos/pos.module';
import { ReportsModule } from './reports/reports.module';
import { MassagePosModule } from './sales/massage/massagepos.module';
import { MealPosModule } from './sales/meal/meal.module';
import { FarmModule } from './farm/farm.module';
import { ManufacturingModule } from './manufacturing/manufacturing.module';
import { ScheduleModule } from '@nestjs/schedule';
import { FinanceModule } from './finance/finance.module';
import { ClientModule } from './sales/customers/customers.module';
import { TablesModule } from './sales/tables/tables.module';
@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads/',
      serveStaticOptions: {
        index: false,
        redirect: false,
      },
    }),
    ScheduleModule.forRoot(),
    CompanyModule,
    BranchModule,
    PrismaModule,
    RoleModule,
    EventsModule,
    ClientModule,
    ExhibitionModule,
    BankModule,
    ChequeModule,
    HumanResourceModule,
    AuthModule,
    InventoryModule,
    BranchExpenseModule,
    ProjectsModule,
    PosModule,
    ReportsModule,
    MassagePosModule,
    MealPosModule,
    FarmModule,
    ManufacturingModule,
    FinanceModule,
    TablesModule,
  ],
})
export class AppModule {}
