import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(AuthGuard('jwt'))
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sucursales')
  async getSucursales() {
    const sucursales = await this.reportsService.getSucursales();
    return { sucursales };
  }

  @Get('sales')
  async getSalesReport(
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
    @Query('idSucursal') idSucursal: string,
    @Req() req: any,
  ) {
    const sucursalId = idSucursal ? parseInt(idSucursal) : undefined;
    const data = await this.reportsService.getSalesReport(fechaInicio, fechaFin, sucursalId);
    return data;
  }
}
