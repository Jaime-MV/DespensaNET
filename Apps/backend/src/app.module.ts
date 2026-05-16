// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SalesModule } from './modules/sales/sales.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { TransfersModule } from './modules/transfers/transfers.module';

@Module({
  imports: [
    // Load .env globally
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    SalesModule,
    DashboardModule,
    InventoryModule,
    TransfersModule,
  ],
})
export class AppModule {}
