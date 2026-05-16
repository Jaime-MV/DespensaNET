import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { CreateTransferDto, UpdateTransferStatusDto } from './dto/transfers.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('transfers')
@UseGuards(JwtAuthGuard)
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  /** GET /transfers/products/search?q=galletas  — stock across all branches */
  @Get('products/search')
  async searchProducts(@Query('q') query: string) {
    return await this.transfersService.searchProductsWithStock(query || '');
  }

  @Post()
  async create(@Body() createTransferDto: CreateTransferDto, @Request() req) {
    return await this.transfersService.create(createTransferDto, req.user.id);
  }

  @Get()
  async findAll(@Request() req) {
    return await this.transfersService.findAll(req.user);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateTransferStatusDto,
    @Request() req
  ) {
    return await this.transfersService.updateStatus(id, updateDto, req.user.id);
  }
}
