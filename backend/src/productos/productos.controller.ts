import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ProductosService } from './productos.service';
import { CreateProductoDto, UpdateProductoDto } from './productos.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('productos')
@UseGuards(JwtAuthGuard)
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  @Post()
  create(@Request() req, @Body() createProductoDto: CreateProductoDto) {
    return this.productosService.create(req.user.userId, createProductoDto);
  }

  @Get()
  findAll(@Request() req, @Query('search') search?: string, @Query('activo') activo?: string) {
    const activoBool = activo !== undefined ? activo === 'true' : undefined;
    return this.productosService.findAll(req.user.userId, search, activoBool);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.productosService.findOne(req.user.userId, +id);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() updateProductoDto: UpdateProductoDto) {
    return this.productosService.update(req.user.userId, +id, updateProductoDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.productosService.remove(req.user.userId, +id);
  }
}
