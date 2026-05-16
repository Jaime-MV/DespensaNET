import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Propietario', 'Encargado')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('branches')
  getBranches() {
    return this.usersService.getBranches();
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto, @Request() req: any) {
    return this.usersService.create(
      createUserDto,
      req.user.role,
      req.user.idSucursal,
    );
  }

  @Get()
  findAll(@Request() req: any) {
    return this.usersService.findAll(req.user.role, req.user.idSucursal);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.usersService.findOne(id, req.user.role, req.user.idSucursal);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: any,
  ) {
    return this.usersService.update(
      id,
      updateUserDto,
      req.user.role,
      req.user.idSucursal,
    );
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.usersService.remove(id, req.user.role, req.user.idSucursal);
  }
}
