// src/modules/sales/sales.controller.ts
import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SalesService } from './sales.service';

@Controller('sales')
@UseGuards(AuthGuard('jwt'))
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  /**
   * GET /api/sales/product?code=XXX
   * Search a product by its serial/barcode.
   * Requires the user's branch (from JWT payload).
   */
  @Get('product')
  async searchProduct(@Query('q') q: string, @Query('code') code: string, @Req() req: any) {
    const idSucursal = req.user.idSucursal;
    const searchTerm = q || code || '';
    const products = await this.salesService.searchProducts(searchTerm, idSucursal);
    return { products };
  }

  /**
   * POST /api/sales
   * Finalize a sale. Body: { metodoPago, items, total }
   */
  @Post()
  async createSale(@Body() body: any, @Req() req: any) {
    const result = await this.salesService.createSale({
      idSucursal: req.user.idSucursal,
      idUsuario: req.user.id,
      metodoPago: body.metodoPago,
      items: body.items,
      total: body.total,
    });
    return result;
  }

  /**
   * GET /api/sales/today
   * Get today's sales for the user's branch.
   */
  @Get('today')
  async todaySales(@Req() req: any) {
    const sales = await this.salesService.getTodaySales(req.user.idSucursal);
    return { sales };
  }

  /**
   * GET /api/sales/offers
   * Get active offers for the user's branch (read-only).
   */
  @Get('offers')
  async activeOffers(@Req() req: any) {
    const offers = await this.salesService.getActiveOffers(req.user.idSucursal);
    return { offers };
  }
}
