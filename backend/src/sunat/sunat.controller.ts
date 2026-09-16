import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { SunatService } from './sunat.service';
import { ConsultRucDto } from './sunat.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('sunat')
@UseGuards(JwtAuthGuard)
export class SunatController {
  constructor(private readonly sunatService: SunatService) {}

  @Post('ruc')
  consultarRuc(@Body() dto: ConsultRucDto) {
    return this.sunatService.consultarRuc(dto.ruc);
  }
}