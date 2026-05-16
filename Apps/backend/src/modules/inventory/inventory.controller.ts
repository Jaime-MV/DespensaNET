import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InventoryService } from './inventory.service';

@Controller('inventory')
@UseGuards(AuthGuard('jwt'))
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  async getProducts(@Req() req: any) {
    // Si es propietario, idSucursal es null
    const idSucursal = req.user.idSucursal;
    const products = await this.inventoryService.getProducts(idSucursal);
    return { products };
  }

  @Post()
  async createProduct(@Body() body: any) {
    const product = await this.inventoryService.createProduct(body);
    return { product };
  }

  @Put(':id')
  async updateProduct(@Param('id') id: string, @Body() body: any) {
    const product = await this.inventoryService.updateProduct(parseInt(id), body);
    return { product };
  }

  @Delete(':id')
  async deleteProduct(@Param('id') id: string) {
    const product = await this.inventoryService.deleteProduct(parseInt(id));
    return { product };
  }

  @Put(':id/stock')
  async updateStock(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const idSucursal = req.user.idSucursal;
    if (!idSucursal) throw new Error('El propietario no puede modificar stock directamente sin especificar sucursal.');
    const stock = await this.inventoryService.updateStock(parseInt(id), idSucursal, body.cantidad, body.stock_minimo);
    return { stock };
  }

  // ── OFFERS ──
  @Get('offers')
  async getOffers(@Query('tipo') tipo: string) {
    const offers = await this.inventoryService.getOffers(tipo);
    return { offers };
  }

  @Post('offers')
  async createOffer(@Body() body: any, @Req() req: any) {
    const userId = req.user.id;
    const offer = await this.inventoryService.createOffer(body, userId);
    return { offer };
  }

  @Put('offers/:id')
  async updateOffer(@Param('id') id: string, @Body() body: any) {
    const offer = await this.inventoryService.updateOffer(parseInt(id), body);
    return { offer };
  }

  @Delete('offers/:id')
  async deleteOffer(@Param('id') id: string) {
    const offer = await this.inventoryService.deleteOffer(parseInt(id));
    return { offer };
  }
}
