import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { CreateClienteDto, UpdateClienteDto } from './clientes.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('clientes')
@UseGuards(JwtAuthGuard)
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Post()
  create(@Request() req, @Body() createClienteDto: CreateClienteDto) {
    return this.clientesService.create(req.user.userId, createClienteDto);
  }

  @Get()
  findAll(@Request() req, @Query('search') search?: string) {
    return this.clientesService.findAll(req.user.userId, search);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.clientesService.findOne(req.user.userId, +id);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() updateClienteDto: UpdateClienteDto) {
    return this.clientesService.update(req.user.userId, +id, updateClienteDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.clientesService.remove(req.user.userId, +id);
  }
}
