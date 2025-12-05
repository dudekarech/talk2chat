import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('🔌 Connected to database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('🔌 Disconnected from database');
  }

  // Helper method for multi-tenant queries
  async withCompanyScope<T>(
    companyId: string,
    queryFn: (prisma: PrismaClient) => Promise<T>
  ): Promise<T> {
    // In a real implementation, you might add additional security checks here
    return queryFn(this);
  }

  // Helper method for superadmin queries
  async withSuperAdminScope<T>(
    queryFn: (prisma: PrismaClient) => Promise<T>
  ): Promise<T> {
    // In a real implementation, you might add additional security checks here
    return queryFn(this);
  }
}
