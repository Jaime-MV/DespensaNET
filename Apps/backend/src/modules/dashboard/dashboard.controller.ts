// src/modules/dashboard/dashboard.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * GET /dashboard
   *
   * Retorna un JSON consolidado con KPIs, gráficos y tablas
   * para el Dashboard Global del Propietario.
   *
   * Acceso: solo rol 'Propietario'.
   */
  @Get()
  @Roles('Propietario')
  getDashboard() {
    return this.dashboardService.getGlobalDashboard();
  }
}
