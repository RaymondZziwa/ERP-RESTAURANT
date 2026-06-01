import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthDto, PinLoginDto } from 'src/dto/auth.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  IRefreshTokenResponse,
  IUserAuthWithoutPassword,
  IUserAuthWithoutToken,
} from 'src/types/userAuth';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async pinLogin(data: PinLoginDto): Promise<IUserAuthWithoutPassword> {
    const { pin } = data;
    const accessTokenExpiry = '1d';
    const refreshTokenExpiry = '7d';

    try {
      // Find all active employees (consider caching this)
      const employees = await this.prismaService.employee.findMany({
        where: {
          hasAccess: true,
          isActive: true,
        },
        include: {
          branch: { select: { id: true, name: true } },
          dept: { select: { id: true, name: true } },
          role: { select: { id: true, name: true, permissions: true } },
        },
      });

      // Find the employee with matching PIN
      let foundUser: IUserAuthWithoutToken | null = null;
      for (const employee of employees) {
        const isValid = await bcrypt.compare(pin, employee.pin || '');
        if (isValid) {
          foundUser = employee ? employee : null;
          break;
        }
      }

      if (!foundUser) {
        throw new UnauthorizedException('Invalid PIN');
      }

      // Generate tokens
      const payload = {
        sub: foundUser.id,
        email: foundUser.email,
        lastName: foundUser.lastName,
      };

      const [accessToken, refreshToken] = await Promise.all([
        this.jwtService.signAsync(payload, {
          secret:
            this.configService.get<string>('JWT_SECRET') || 'fallback-secret',
          expiresIn: accessTokenExpiry,
        }),
        this.jwtService.signAsync(payload, {
          secret:
            this.configService.get<string>('JWT_REFRESH_SECRET') ||
            'fallback-refresh-secret',
          expiresIn: refreshTokenExpiry,
        }),
      ]);

      return {
        id: foundUser.id,
        firstName: foundUser.firstName,
        lastName: foundUser.lastName,
        gender: foundUser.gender,
        email: foundUser.email,
        salary: foundUser.salary,
        tel: foundUser.tel,
        pin: foundUser.pin,
        hasAccess: foundUser.hasAccess,
        hasPrescriptionAccess: foundUser.hasPrescriptionAccess,
        isActive: foundUser.isActive,
        profileImage: foundUser.profileImage || '',
        updatedAt: foundUser.updatedAt,
        createdAt: foundUser.createdAt,
        role: foundUser.role
          ? {
              id: Number(foundUser.role.id),
              name: foundUser.role.name,
              permissions: foundUser.role.permissions,
            }
          : null,
        branch: foundUser.branch
          ? {
              id: Number(foundUser.branch.id),
              name: foundUser.branch.name,
            }
          : null,
        dept: foundUser.dept
          ? {
              id: Number(foundUser.dept.id),
              name: foundUser.dept.name,
            }
          : null,
        token: { accessToken, refreshToken },
      };
    } catch (error: unknown) {
      console.log('Pin login error:', error);

      if (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      console.error('Login error:', error);
      throw new InternalServerErrorException('Authentication error');
    }
  }
  async login(data: AuthDto): Promise<IUserAuthWithoutPassword> {
    const { loginMethod, email: identifier, password, rememberMe } = data;
    const accessTokenExpiry = rememberMe ? '7d' : '1d';
    const refreshTokenExpiry = rememberMe ? '30d' : '7d';

    try {
      let user: IUserAuthWithoutToken;

      // Find user
      if (loginMethod?.toLowerCase() === 'email') {
        user = await this.prismaService.employee.findUniqueOrThrow({
          where: { email: identifier },
          include: {
            branch: { select: { id: true, name: true } },
            dept: { select: { id: true, name: true } },
            role: { select: { id: true, name: true, permissions: true } },
          },
        });
      } else {
        user = await this.prismaService.employee.findUniqueOrThrow({
          where: { tel: identifier },
          include: {
            branch: { select: { id: true, name: true } },
            dept: { select: { id: true, name: true } },
            role: { select: { id: true, name: true, permissions: true } },
          },
        });
      }

      // Validate user access
      if (!user.hasAccess) {
        throw new ForbiddenException('User account is disabled');
      }

      if (!user.isActive) {
        throw new ForbiddenException('User account is inactive');
      }

      // Validate password
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Generate tokens and return
      const payload = {
        sub: user.id,
        email: user.email,
        lastName: user.lastName,
      };

      const [accessToken, refreshToken] = await Promise.all([
        this.jwtService.signAsync(payload, {
          secret:
            this.configService.get<string>('JWT_SECRET') || 'fallback-secret',
          expiresIn: accessTokenExpiry,
        }),
        this.jwtService.signAsync(payload, {
          secret:
            this.configService.get<string>('JWT_REFRESH_SECRET') ||
            'fallback-refresh-secret',
          expiresIn: refreshTokenExpiry,
        }),
      ]);

      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        gender: user.gender,
        email: user.email,
        salary: user.salary,
        tel: user.tel,
        pin: user.pin,
        hasAccess: user.hasAccess,
        hasPrescriptionAccess: user.hasPrescriptionAccess,
        isActive: user.isActive,
        profileImage: user.profileImage || '',
        updatedAt: user.updatedAt,
        createdAt: user.createdAt,
        role: user.role
          ? {
              id: Number(user.role.id),
              name: user.role.name,
              permissions: user.role.permissions,
            }
          : null,
        branch: user.branch
          ? {
              id: Number(user.branch.id),
              name: user.branch.name,
            }
          : null,
        dept: user.dept
          ? {
              id: Number(user.dept.id),
              name: user.dept.name,
            }
          : null,
        token: { accessToken, refreshToken },
      };
    } catch (error: unknown) {
      // Handle Prisma not found error
      if (typeof error === 'object' && error !== null && 'code' in error) {
        const err = error as { code?: string };
        if (err.code === 'P2025') {
          throw new NotFoundException('Credentials not found');
        }
      }

      // Re-throw known exceptions
      if (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      // Log and throw for unknown errors
      console.error('Login error:', error);
      throw new InternalServerErrorException('Authentication error');
    }
  }

  async pbdLogin(data: AuthDto): Promise<IUserAuthWithoutPassword> {
    const { loginMethod, email: identifier, password, rememberMe } = data;
    const accessTokenExpiry = rememberMe ? '7d' : '1d';
    const refreshTokenExpiry = rememberMe ? '30d' : '7d';

    try {
      let user: IUserAuthWithoutToken;

      // Find user
      if (loginMethod?.toLowerCase() === 'email') {
        user = await this.prismaService.employee.findUniqueOrThrow({
          where: { email: identifier },
          include: {
            branch: { select: { id: true, name: true } },
            dept: { select: { id: true, name: true } },
            role: { select: { id: true, name: true, permissions: true } },
          },
        });
      } else {
        user = await this.prismaService.employee.findUniqueOrThrow({
          where: { tel: identifier },
          include: {
            branch: { select: { id: true, name: true } },
            dept: { select: { id: true, name: true } },
            role: { select: { id: true, name: true, permissions: true } },
          },
        });
      }

      // Validate user access
      if (!user.hasAccess) {
        throw new ForbiddenException('User account is disabled');
      }

      if (!user.isActive) {
        throw new ForbiddenException('User account is inactive');
      }

      //Validate prescription database access
      if (!user.hasPrescriptionAccess) {
        throw new ForbiddenException(
          'You are not authorized to access the prescription database',
        );
      }

      // Validate password
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Generate tokens and return
      const payload = {
        sub: user.id,
        email: user.email,
        lastName: user.lastName,
      };

      const [accessToken, refreshToken] = await Promise.all([
        this.jwtService.signAsync(payload, {
          secret:
            this.configService.get<string>('JWT_SECRET') || 'fallback-secret',
          expiresIn: accessTokenExpiry,
        }),
        this.jwtService.signAsync(payload, {
          secret:
            this.configService.get<string>('JWT_REFRESH_SECRET') ||
            'fallback-refresh-secret',
          expiresIn: refreshTokenExpiry,
        }),
      ]);

      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        gender: user.gender,
        email: user.email,
        salary: user.salary,
        pin: user.pin,
        tel: user.tel,
        hasAccess: user.hasAccess,
        hasPrescriptionAccess: user.hasPrescriptionAccess,
        isActive: user.isActive,
        profileImage: user.profileImage || '',
        updatedAt: user.updatedAt,
        createdAt: user.createdAt,
        role: user.role
          ? {
              id: Number(user.role.id),
              name: user.role.name,
              permissions: user.role.permissions,
            }
          : null,
        branch: user.branch
          ? {
              id: Number(user.branch.id),
              name: user.branch.name,
            }
          : null,
        dept: user.dept
          ? {
              id: Number(user.dept.id),
              name: user.dept.name,
            }
          : null,
        token: { accessToken, refreshToken },
      };
    } catch (error: unknown) {
      // Handle Prisma not found error
      if (typeof error === 'object' && error !== null && 'code' in error) {
        const err = error as { code?: string };
        if (err.code === 'P2025') {
          console.log(err);
          throw new NotFoundException('Credentials not found');
        }
      }
      // Re-throw known exceptions
      if (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      // Log and throw for unknown errors
      console.error('Login error:', error);
      throw new InternalServerErrorException('Authentication error');
    }
  }

  async refreshTokens(userId: number): Promise<IRefreshTokenResponse> {
    try {
      // Check if user still exists and is active
      const user = await this.prismaService.employee.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          hasAccess: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive || !user.hasAccess) {
        throw new ForbiddenException('User no longer active or access revoked');
      }

      // Create new tokens
      const newPayload = {
        sub: user.id,
        email: user.email,
        lastName: user.lastName,
      };

      const newAccessToken = await this.jwtService.signAsync(newPayload, {
        secret:
          this.configService.get<string>('JWT_SECRET') || 'fallback-secret',
        expiresIn: '1d',
      });

      const newRefreshToken = await this.jwtService.signAsync(newPayload, {
        secret:
          this.configService.get<string>('JWT_REFRESH_SECRET') ||
          'fallback-refresh-secret',
        expiresIn: '7d',
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        message: 'Tokens refreshed successfully',
      };
    } catch (error: unknown) {
      const errorName =
        typeof error === 'object' && error !== null && 'name' in error
          ? String((error as { name?: unknown }).name)
          : '';

      if (errorName === 'TokenExpiredError') {
        throw new UnauthorizedException('Refresh token expired');
      } else if (errorName === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid refresh token');
      }
      throw new UnauthorizedException('Token refresh failed');
    }
  }

  // Optional: Method to get current user from token
  async getCurrentUser(userId: number) {
    const user = await this.prismaService.employee.findUnique({
      where: { id: userId, hasAccess: true, isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        gender: true,
        hasAccess: true,
        isActive: true,
        profileImage: true,
        updatedAt: true,
        createdAt: true,
        branch: {
          select: { id: true, name: true },
        },
        dept: {
          select: { id: true, name: true },
        },
        role: {
          select: {
            id: true,
            name: true,
            permissions: {
              select: {
                id: true,
                module: true,
                name: true,
                value: true,
                updatedAt: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found or inactive');
    }

    if (!user.hasAccess) {
      throw new UnauthorizedException('User account is suspended');
    }

    return user;
  }

  async validateUser(userId: number) {
    try {
      const user = await this.prismaService.employee.findUnique({
        where: { id: userId, isActive: true },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          hasAccess: true,
          isActive: true,
          branchId: true,
          deptId: true,
          roleId: true,
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
          dept: {
            select: {
              id: true,
              name: true,
            },
          },
          role: {
            select: {
              id: true,
              name: true,
              permissions: true,
            },
          },
        },
      });

      if (!user || !user.hasAccess) {
        return null;
      }

      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        hasAccess: user.hasAccess,
        isActive: user.isActive,
        branchId: user.branchId,
        deptId: user.deptId,
        roleId: user.roleId,
        branch: user.branch || null,
        dept: user.dept || null,
        role: user.role || null,
      };
    } catch {
      return null;
    }
  }
}
