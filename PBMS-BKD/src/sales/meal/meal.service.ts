import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaymentStatus } from '@prisma/client';
import { CollectCreditPaymentDto } from 'src/dto/pos.dto';
import { CreateMealSaleDto, UpdateMealSaleDto } from 'src/dto/meal.dto';
import { collectPayment } from 'src/utils/payments/collectPayment';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';

interface CollectionResponse {
  status: string;
  message: string;

  data: {
    transaction: {
      uuid: string;
      reference: string;
      status: string;
      provider_reference: string;
    };

    collection: {
      amount: {
        total?: number;
        currency?: string;
      };

      provider: string;
      phone_number: string;
      mode: string;
    };

    timeline: {
      initiated_at: string;
      estimated_settlement: string;
    };

    metadata: {
      response_timestamp: string;
      sandbox_mode: boolean;
    };
  };
}

@Injectable()
export class MealSalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private async initiateMobileMoneyCollection(
    total: number,
    phoneNumber: string,
  ) {
    const paymentResult: CollectionResponse = await collectPayment(
      this.httpService,
      this.configService,
      {
        amount: total,
        phone_number: phoneNumber,
        country: 'UG',
        description: 'Meal Payment',
      },
    );

    return paymentResult;
  }

  async create(createSaleDto: CreateMealSaleDto) {
    const {
      tableId,
      items,
      paymentMethod,
      notes,
      total,
      status,
      saleStatus,
      servedBy,
    } = createSaleDto;

    // Check if table exists
    const table = await this.prisma.tables.findUnique({
      where: { id: tableId },
    });

    if (!table) {
      throw new NotFoundException(`Table with ID ${tableId} not found`);
    }

    // Check for ANY active/pending orders on this table
    const existingOrder = await this.prisma.mealSale.findFirst({
      where: {
        tableId: tableId,
        OR: [
          // Order is still in progress
          {
            saleStatus: {
              in: ['PENDING', 'COMPLETE', 'CANCELLED'],
            },
          },
          // Order is completed but not fully paid
          { saleStatus: 'COMPLETE', balance: { gt: 0 } },
          // Order is not cancelled
          { saleStatus: { not: 'CANCELLED' }, balance: { gt: 0 } },
        ],
      },
      include: {
        table: true,
        SalePayments: true,
      },
    });

    // Optional: Check if table is occupied (redundant but safe)
    if (table.status === 'OCCUPIED') {
      throw new BadRequestException(
        `Table ${table.number} is currently marked as occupied. Please free the table first.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const sale = await tx.mealSale.create({
        data: {
          tableId,
          items: JSON.parse(JSON.stringify(items)),
          servedBy,
          saleStatus: saleStatus ?? 'PENDING',
          status,
          total,
          balance: total,
          paymentMethod,
          notes,
        },
        include: {
          employee: true,
          table: true,
          SalePayments: true,
        },
      });

      // Create payment record if payment method provided
      if (paymentMethod) {
        await tx.mealSalePayments.create({
          data: {
            mealSaleId: sale.id,
            amount: total,
            paymentMethod,
            referenceId: '',
            notes,
            cashierId: servedBy,
          },
        });
      }

      // Update table status to OCCUPIED
      await tx.tables.update({
        where: { id: tableId },
        data: { status: 'OCCUPIED' },
      });

      return {
        message: 'Meal order created successfully',
        data: sale,
        status: 200,
      };
    });
  }

  async findAll() {
    const sales = await this.prisma.mealSale.findMany({
      include: {
        employee: true,
        table: true,
        SalePayments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      message: 'Meal orders retrieved successfully',
      data: sales,
      status: 200,
    };
  }

  async findOne(id: number) {
    const sale = await this.prisma.mealSale.findUnique({
      where: { id },
      include: {
        employee: true,
        table: true,
        SalePayments: true,
      },
    });

    if (!sale) {
      throw new NotFoundException(`Meal order with ID ${id} not found`);
    }

    return {
      message: 'Meal order retrieved successfully',
      data: sale,
      status: 200,
    };
  }

  async update(id: number, updateSaleDto: UpdateMealSaleDto) {
    const existingSale = await this.prisma.mealSale.findUnique({
      where: { id },
    });

    if (!existingSale) {
      throw new NotFoundException(`Meal order with ID ${id} not found`);
    }

    if (
      updateSaleDto.status &&
      !Object.values(PaymentStatus).includes(updateSaleDto.status)
    ) {
      throw new BadRequestException(
        `Invalid sale status: ${updateSaleDto.status}`,
      );
    }

    const updateData: any = {
      ...updateSaleDto,
      items: updateSaleDto.items
        ? JSON.parse(JSON.stringify(updateSaleDto.items))
        : undefined,
    };

    const updatedSale = await this.prisma.mealSale.update({
      where: { id },
      data: updateData,
      include: {
        employee: true,
        table: true,
        SalePayments: true,
      },
    });

    return {
      message: 'Meal order updated successfully',
      data: updatedSale,
      status: 200,
    };
  }

  async collectCreditPayment(dto: CollectCreditPaymentDto) {
    const sale = await this.prisma.mealSale.findUnique({
      where: { id: dto.saleId },
    });

    if (!sale) {
      throw new NotFoundException('Meal order not found');
    }

    if (Number(sale.balance) <= 0) {
      throw new BadRequestException('Meal order is already fully paid');
    }

    if (dto.amountPaid > Number(sale.balance)) {
      throw new BadRequestException(
        'Payment amount exceeds outstanding balance',
      );
    }

    const newBalance = Number(sale.balance) - dto.amountPaid;
    const newStatus = newBalance === 0 ? 'FULLY_PAID' : 'PARTIALLY_PAID';

    const updatedSale = await this.prisma.mealSale.update({
      where: { id: dto.saleId },
      data: {
        balance: newBalance,
        status: newStatus,
      },
      include: {
        employee: true,
        table: true,
        SalePayments: true,
      },
    });

    await this.prisma.mealSalePayments.create({
      data: {
        mealSaleId: dto.saleId,
        amount: dto.amountPaid,
        paymentMethod: dto.paymentMethods[0]?.type ?? 'CASH',
        referenceId: dto.referenceId ? String(dto.referenceId) : null,
        notes: dto.notes,
        cashierId: dto.servedBy,
      },
    });

    return {
      message: 'Meal order payment collected successfully',
      data: updatedSale,
      status: 200,
    };
  }

  async cancel(id: number) {
    const existingSale = await this.prisma.mealSale.findUnique({
      where: { id },
      include: { table: true },
    });

    if (!existingSale) {
      throw new NotFoundException(`Meal order with ID ${id} not found`);
    }

    if (existingSale.saleStatus === 'CANCELLED') {
      throw new BadRequestException('Meal order is already cancelled');
    }

    const updatedSale = await this.prisma.$transaction(async (tx) => {
      const sale = await tx.mealSale.update({
        where: { id },
        data: { saleStatus: 'CANCELLED' },
        include: {
          employee: true,
          table: true,
          SalePayments: true,
        },
      });

      if (existingSale.tableId) {
        const pendingCount = await tx.mealSale.count({
          where: {
            tableId: existingSale.tableId,
            saleStatus: 'PENDING',
          },
        });

        if (pendingCount === 0 && existingSale.table?.status === 'OCCUPIED') {
          await tx.tables.update({
            where: { id: existingSale.tableId },
            data: { status: 'AVAILABLE' },
          });
        }
      }

      return sale;
    });

    return {
      message: 'Meal order cancelled successfully',
      data: updatedSale,
      status: 200,
    };
  }

  async remove(id: number) {
    const existing = await this.prisma.mealSale.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Meal order with ID ${id} not found`);
    }

    await this.prisma.mealSale.delete({ where: { id } });

    return {
      message: 'Meal order deleted successfully',
      status: 200,
    };
  }

  async fetchPendingBillsByEmployee(id: number) {
    const pendingBills = await this.prisma.mealSale.findMany({
      where: {
        servedBy: id,
        saleStatus: 'PENDING',
      },
      include: {
        table: true,
      },
    });

    return {
      message: 'Pending bills retrieved successfully',
      data: pendingBills,
      status: 200,
    };
  }

  async collectPayment(
    id: number,
    amountPaid: number,
    paymentMethod: string,
    phoneNumber?: string,
  ) {
    const sale = await this.prisma.mealSale.findUnique({
      where: { id },
    });

    if (!sale) {
      throw new NotFoundException('Meal order not found');
    }

    if (Number(sale.balance) <= 0) {
      throw new BadRequestException('Meal order is already fully paid');
    }

    if (amountPaid > Number(sale.balance)) {
      throw new BadRequestException(
        'Payment amount exceeds outstanding balance',
      );
    }

    const newBalance = Number(sale.balance) - amountPaid;
    const newStatus = newBalance === 0 ? 'FULLY_PAID' : 'PARTIALLY_PAID';

    if (paymentMethod === 'CASH') {
      const updatedSale = await this.prisma.mealSale.update({
        where: { id },
        data: {
          balance: newBalance,
          status: newStatus,
          saleStatus: newStatus === 'FULLY_PAID' ? 'COMPLETE' : sale.saleStatus,
        },
        include: {
          employee: true,
          table: true,
          SalePayments: true,
        },
      });

      await this.prisma.mealSalePayments.create({
        data: {
          mealSaleId: id,
          amount: amountPaid,
          paymentMethod,
          referenceId: '',
          notes: '',
          cashierId: sale.servedBy,
        },
      });

      if (sale?.tableId != null) {
        await this.prisma.tables.update({
          where: { id: sale.tableId },
          data: { status: 'AVAILABLE' },
        });
      }

      return {
        message: 'Meal order payment collected successfully',
        data: updatedSale,
        status: 200,
      };
    } else {
      const response = await this.initiateMobileMoneyCollection(
        amountPaid,
        phoneNumber ? String(phoneNumber) : '',
      );

      console.log('Mobile money collection response:', response);

      console.log(amountPaid, phoneNumber);
      const mealSalePayment = await this.prisma.mealSalePayments.create({
        data: {
          mealSaleId: id,
          amount: amountPaid,
          paymentMethod,
          referenceId: response.data.transaction.reference,
          notes: `Mobile money collection - ${response.data.transaction.status}`,
          cashierId: sale.servedBy,
        },
      });

      await this.prisma.mealSalePaymentTransactionHistory.create({
        data: {
          mealSalePaymentId: mealSalePayment.id,
          transaction_uuid: response.data.transaction.uuid,
          transaction_reference: response.data.transaction.reference,
          provider_transaction_id: response.data.transaction.provider_reference,
          amount: amountPaid,
          amount_formatted: String(amountPaid),
          currency: 'UGX',
          payment_method: paymentMethod,
          provider: response.data.collection.provider,
          provider_mode: response.data.collection.mode,
          phone_number: response.data.collection.phone_number,
          status: 'PENDING',
          description: 'Mobile money collection initiated',
          notes: 'Mobile money collection initiated',
          cashierId: sale.servedBy,
          transaction_initiated_at: response.data.timeline?.initiated_at
            ? new Date(response.data.timeline.initiated_at)
            : null,
        },
      });

      return {
        message:
          'Mobile money collection initiated. Sale will be completed upon successful payment.',
        data: { sale, transaction: response.data.transaction },
        status: 200,
      };
    }
  }

  async getEmployeePastBills(employeeId: number) {
    const pastBills = await this.prisma.mealSale.findMany({
      where: {
        servedBy: employeeId,
      },
      include: {
        table: true,
        SalePayments: true,
      },
    });

    return {
      message: 'Past bills retrieved successfully',
      data: pastBills,
      status: 200,
    };
  }

  async getOrderHistory() {
    const pastOrders = await this.prisma.mealSale.findMany({
      include: {
        table: true,
        SalePayments: true,
        employee: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return {
      message: 'Order history retrieved successfully',
      data: pastOrders,
      status: 200,
    };
  }

  async getPendingOrders() {
    const pendingOrders = await this.prisma.mealSale.findMany({
      where: {
        saleStatus: 'PENDING',
      },
      include: {
        table: true,
        SalePayments: true,
        employee: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    return {
      message: 'Pending orders retrieved successfully',
      data: pendingOrders,
      status: 200,
    };
  }
}
