import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { AgentsModule } from './modules/agents/agents.module';
import { CallsModule } from './modules/calls/calls.module';
import { WidgetsModule } from './modules/widgets/widgets.module';
import { WebSocketModule } from './modules/websocket/websocket.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Database
    PrismaModule,
    
    // Feature modules
    AuthModule,
    CompaniesModule,
    AgentsModule,
    CallsModule,
    WidgetsModule,
    WebSocketModule,
  ],
})
export class AppModule {}
