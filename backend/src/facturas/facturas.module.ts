import { Module } from '@nestjs/common';
import { FacturasService } from './facturas.service';
import { FacturasController } from './facturas.controller';
import { NubefactService } from './nubefact.service';

@Module({
  controllers: [FacturasController],
  providers: [FacturasService, NubefactService],
  exports: [FacturasService],
})
export class FacturasModule {}
