import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { FacturasService } from './facturas.service';
import { CreateFacturaDto, AnularFacturaDto } from './facturas.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('facturas')
@UseGuards(JwtAuthGuard)
export class FacturasController {
  constructor(private readonly facturasService: FacturasService) {}

  @Post()
  create(@Request() req, @Body() dto: CreateFacturaDto) {
    return this.facturasService.generate(req.user.userId, dto);
  }

  @Get('estadisticas')
  getEstadisticas(@Request() req) {
    return this.facturasService.getEstadisticas(req.user.userId);
  }

  @Get()
  findAll(
    @Request() req,
    @Query('tipo') tipo?: string,
    @Query('anulado') anulado?: string,
  ) {
    const tipoN = tipo !== undefined ? +tipo : undefined;
    const anuladoB = anulado !== undefined ? anulado === 'true' : undefined;
    return this.facturasService.findAll(req.user.userId, tipoN, anuladoB);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.facturasService.findOne(req.user.userId, +id);
  }

  @Post(':id/consultar')
  consultar(@Request() req, @Param('id') id: string) {
    return this.facturasService.consultarNubefact(req.user.userId, +id);
  }

  @Post(':id/anular')
  anular(@Request() req, @Param('id') id: string, @Body() dto: AnularFacturaDto) {
    return this.facturasService.anular(req.user.userId, +id, dto);
  }

  @Get(':id/consultar-anulacion')
  consultarAnulacion(@Request() req, @Param('id') id: string) {
    return this.facturasService.consultarAnulacionNubefact(req.user.userId, +id);
  }
}
