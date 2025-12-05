import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async createCompany(createCompanyDto: CreateCompanyDto, createdByUserId: string) {
    // Check if user is superadmin
    const user = await this.prisma.user.findUnique({
      where: { id: createdByUserId },
    });

    if (user.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Only superadmins can create companies');
    }

    // Create company with unique UUID
    const company = await this.prisma.company.create({
      data: {
        ...createCompanyDto,
        status: 'PENDING',
      },
    });

    // Create default widget configuration
    await this.prisma.widget.create({
      data: {
        companyId: company.id,
        config: {
          position: 'bottom-right',
          primaryColor: '#007bff',
          secondaryColor: '#6c757d',
          buttonText: 'Call Us',
          welcomeMessage: 'Welcome! How can we help you today?',
        },
        isActive: true,
      },
    });

    return company;
  }

  async findAll(userId: string, userRole: UserRole) {
    if (userRole === UserRole.SUPERADMIN) {
      // Superadmin can see all companies
      return this.prisma.company.findMany({
        include: {
          _count: {
            select: {
              users: true,
              agents: true,
              calls: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Company users can only see their own company
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { companyId: true },
      });

      if (!user.companyId) {
        throw new ForbiddenException('User not associated with any company');
      }

      return this.prisma.company.findMany({
        where: { id: user.companyId },
        include: {
          _count: {
            select: {
              users: true,
              agents: true,
              calls: true,
            },
          },
        },
      });
    }
  }

  async findOne(id: string, userId: string, userRole: UserRole) {
    if (userRole === UserRole.SUPERADMIN) {
      // Superadmin can access any company
      const company = await this.prisma.company.findUnique({
        where: { id },
        include: {
          users: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              status: true,
              createdAt: true,
            },
          },
          agents: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          widgets: true,
          _count: {
            select: {
              calls: true,
            },
          },
        },
      });

      if (!company) {
        throw new NotFoundException('Company not found');
      }

      return company;
    } else {
      // Company users can only access their own company
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { companyId: true },
      });

      if (user.companyId !== id) {
        throw new ForbiddenException('Access denied to this company');
      }

      return this.prisma.company.findUnique({
        where: { id },
        include: {
          users: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              status: true,
              createdAt: true,
            },
          },
          agents: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          widgets: true,
          _count: {
            select: {
              calls: true,
            },
          },
        },
      });
    }
  }

  async findByUuid(uuid: string) {
    const company = await this.prisma.company.findUnique({
      where: { uuid },
      include: {
        widgets: true,
        agents: {
          where: { status: 'ONLINE' },
          select: {
            id: true,
            status: true,
            skills: true,
            maxCalls: true,
          },
        },
      },
    });

    if (!company || company.status !== 'ACTIVE') {
      throw new NotFoundException('Company not found or inactive');
    }

    return company;
  }

  async updateCompany(id: string, updateCompanyDto: UpdateCompanyDto, userId: string, userRole: UserRole) {
    if (userRole === UserRole.SUPERADMIN) {
      // Superadmin can update any company
      return this.prisma.company.update({
        where: { id },
        data: updateCompanyDto,
      });
    } else {
      // Company users can only update their own company
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { companyId: true },
      });

      if (user.companyId !== id) {
        throw new ForbiddenException('Access denied to this company');
      }

      return this.prisma.company.update({
        where: { id },
        data: updateCompanyDto,
      });
    }
  }

  async approveCompany(id: string, userId: string) {
    // Only superadmins can approve companies
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (user.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Only superadmins can approve companies');
    }

    return this.prisma.company.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });
  }

  async suspendCompany(id: string, userId: string) {
    // Only superadmins can suspend companies
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (user.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Only superadmins can suspend companies');
    }

    return this.prisma.company.update({
      where: { id },
      data: { status: 'SUSPENDED' },
    });
  }

  async getWidgetEmbedCode(companyId: string, userId: string, userRole: UserRole) {
    if (userRole === UserRole.SUPERADMIN) {
      // Superadmin can get widget code for any company
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
        select: { uuid: true },
      });

      if (!company) {
        throw new NotFoundException('Company not found');
      }

      return {
        embedCode: `<script src="https://cdn.callnest.io/widget.js" data-uuid="${company.uuid}"></script>`,
        uuid: company.uuid,
      };
    } else {
      // Company users can only get their own widget code
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { companyId: true },
      });

      if (user.companyId !== companyId) {
        throw new ForbiddenException('Access denied to this company');
      }

      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
        select: { uuid: true },
      });

      return {
        embedCode: `<script src="https://cdn.callnest.io/widget.js" data-uuid="${company.uuid}"></script>`,
        uuid: company.uuid,
      };
    }
  }
}
