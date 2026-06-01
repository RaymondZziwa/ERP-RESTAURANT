import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateEmployeeDto,
  employeeProfileUpdateDto,
  saveEmployeeSystemSettingsDto,
  UpdateEmployeeDto,
} from 'src/dto/humanResource.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Gender } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { join } from 'path';
import { unlink } from 'fs/promises';

@Injectable()
export class EmployeeService {
  constructor(private readonly prisma: PrismaService) {}
  private readonly saltRounds = 12;

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(this.saltRounds);
    return bcrypt.hash(password, salt);
  }

  async create(dto: CreateEmployeeDto) {
    try {
      const hashedPassword = await this.hashPassword(dto.password);
      await this.prisma.employee.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          gender: dto.gender as Gender,
          email: dto.email,
          tel: dto.tel,
          password: hashedPassword,
          salary: dto.salary,
          hasAccess: dto.hasAccess ?? false,
          hasPrescriptionAccess: dto.hasPrescriptionAccess ?? false,
          isActive: dto.isActive ?? true,
          profileImage: dto.profileImage,
          roleId: dto.roleId,
          branchId: dto.branchId,
          deptId: dto.deptId,
        },
      });
      return {
        status: 201,
        data: [],
        message: 'Employee has been saved successfully',
      };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error);
    }
  }

  async findAll() {
    const emps = await this.prisma.employee.findMany({
      include: {
        role: true,
        branch: true,
        dept: true,
        Attendance: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      status: 200,
      data: emps,
      message: 'Employees fetched successfully',
    };
  }

  async findOne(id: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        role: true,
        branch: true,
        dept: true,
      },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with id ${id} not found`);
    }
    return employee;
  }

  async update(id: number, dto: UpdateEmployeeDto) {
    await this.findOne(id);

    await this.prisma.employee.update({
      where: { id },
      data: dto as Prisma.EmployeeUncheckedUpdateInput,
    });

    return {
      status: 200,
      data: [],
      message: 'Employee modified successfully',
    };
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.employee.delete({
      where: { id },
    });
    return {
      status: 200,
      data: [],
      message: 'Employees deleted successfully',
    };
  }

  async updateProfileImage(employeeId: number, file: Express.Multer.File) {
    if (!file) {
      throw new NotFoundException('No file uploaded');
    }

    const imagePath = `/uploads/images/${file.filename}`;

    // ✅ Optional: delete old image
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    if (employee.profileImage) {
      const filePath = join(
        process.cwd(),
        'uploads/images',
        employee.profileImage,
      );
      try {
        await unlink(filePath);
      } catch (err) {
        console.warn('Profile image deletion failed:', err);
      }
    }

    // ✅ Update database
    await this.prisma.employee.update({
      where: { id: employeeId },
      data: { profileImage: imagePath },
    });

    return {
      message: 'Profile image updated successfully',
      imageUrl: imagePath,
    };
  }

  async exportEmployeeData(id: number) {
    await this.findOne(id);
  }

  async employeeProfileUpdate(id: number, dto: employeeProfileUpdateDto) {
    const employee = await this.findOne(id);

    if (!employee) {
      throw new NotFoundException(`Employee with id ${id} not found`);
    }

    const updatedData: Prisma.EmployeeUncheckedUpdateInput = {
      email: dto.email ?? employee.email,
      tel: dto.tel ?? employee.tel,
    };

    if (dto.password) {
      const hashedPassword = await this.hashPassword(dto.password);
      updatedData.password = hashedPassword;
    }

    await this.prisma.employee.update({
      where: { id },
      data: updatedData,
    });

    return {
      status: 200,
      data: [],
      message: 'Employee profile updated successfully',
    };
  }

  async saveEmployeeSystemSettings(
    id: number,
    dto: saveEmployeeSystemSettingsDto,
  ) {
    await this.findOne(id);
  }

  async disableAccount(id: number) {
    await this.findOne(id);
    await this.prisma.employee.update({
      where: { id },
      data: { hasAccess: false },
    });
    return {
      status: 200,
      data: [],
      message: 'Employee Account disabled successfully',
    };
  }

  // In your employee service/controller

  async setEmployeePin(id: number, pin: string) {
    await this.findOne(id);

    // CHECK UNIQUENESS - ensure no other employee has this PIN
    const existingEmployeeWithPin = await this.prisma.employee.findFirst({
      where: {
        password: await this.hashPassword(pin), // Hash first then compare
        id: { not: id }, // Exclude current employee
      },
    });

    if (existingEmployeeWithPin) {
      return {
        status: 400,
        data: [],
        message:
          'This PIN is already assigned to another employee. Please use a different PIN.',
      };
    }

    const hashedPin = await this.hashPassword(pin);
    await this.prisma.employee.update({
      where: { id },
      data: { pin: hashedPin },
    });

    return {
      status: 200,
      data: [],
      message: 'Employee PIN set successfully',
    };
  }
}
