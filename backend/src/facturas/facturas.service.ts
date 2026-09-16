import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NubefactService } from './nubefact.service';
import { CreateFacturaDto, AnularFacturaDto } from './facturas.dto';

function formatDate(date: Date): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

type DbClient = PrismaService | Prisma.TransactionClient;

@Injectable()
export class FacturasService {
  constructor(private prisma: PrismaService, private nubefact: NubefactService) {}

  async getNextNumero(tx: DbClient, userId: number, tipo: number, serie: string): Promise<number> {
    const rows: Array<{ numero: number }> = await tx.$queryRaw`
      SELECT numero FROM Factura
      WHERE userId = ${userId} AND tipo_de_comprobante = ${tipo} AND serie = ${serie}
      ORDER BY numero DESC
      LIMIT 1
      FOR UPDATE
    `;
    return rows.length ? Number(rows[0].numero) + 1 : 1;
  }

  private getTipoIgv(itemDto: any, producto: any): number {
    return itemDto.tipo_de_igv ?? producto.tipo_de_igv ?? 1;
  }

  async generate(userId: number, dto: CreateFacturaDto) {
    const serie = dto.serie || (dto.tipo_de_comprobante === 2 ? 'B001' : 'F001');

    return this.prisma.$transaction(async (tx) => {
      const cliente = await tx.cliente.findFirst({
        where: { id: dto.clienteId, userId },
      });
      if (!cliente) throw new NotFoundException('Cliente no encontrado');

      const items = [];
      for (const itemDto of dto.items) {
        const producto = await tx.producto.findFirst({
          where: { id: itemDto.productoId, userId },
        });
        if (!producto) throw new NotFoundException(`Producto ${itemDto.productoId} no encontrado`);
        items.push({ producto, dto: itemDto });
      }

      const numero = dto.numero || (await this.getNextNumero(tx, userId, dto.tipo_de_comprobante, serie));

      const sumBy = (tipoIgv) => (acc: number, i: any) =>
        this.getTipoIgv(i.dto, i.producto) === tipoIgv ? acc + (Number(i.dto.subtotal) || 0) : acc;
      const totalGravada = items.reduce(sumBy(1), 0);
      const totalInafecta = items.reduce(sumBy(9), 0);
      const totalExonerada = items.reduce(sumBy(8), 0);
      const totalIgv = items.reduce((s, i) => {
        return this.getTipoIgv(i.dto, i.producto) === 1 ? s + (Number(i.dto.igv) || 0) : s;
      }, 0);
      const total = items.reduce((s, i) => s + (Number(i.dto.total) || 0), 0);

      const payloadNubefact: any = {
        tipo_de_comprobante: dto.tipo_de_comprobante,
        serie,
        numero,
        sunat_transaction: dto.sunat_transaction || 1,
        cliente_tipo_de_documento: cliente.tipo_de_documento,
        cliente_numero_de_documento: cliente.numero_de_documento,
        cliente_denominacion: cliente.denominacion,
        cliente_direccion: cliente.direccion || '',
        cliente_email: cliente.email || '',
        fecha_de_emision: formatDate(dto.fecha_de_emision || new Date()),
        fecha_de_vencimiento: dto.fecha_de_vencimiento ? formatDate(dto.fecha_de_vencimiento) : '',
        moneda: dto.moneda || 1,
        tipo_de_cambio: dto.tipo_de_cambio || '',
        porcentaje_de_igv: dto.porcentaje_de_igv || 18.0,
        descuento_global: dto.descuento_global || '',
        total_descuento: dto.total_descuento || '',
        total_anticipo: '',
        total_gravada: parseFloat(totalGravada.toFixed(2)),
        total_inafecta: totalInafecta > 0 ? parseFloat(totalInafecta.toFixed(2)) : dto.total_inafecta || '',
        total_exonerada: totalExonerada > 0 ? parseFloat(totalExonerada.toFixed(2)) : dto.total_exonerada || '',
        total_igv: parseFloat(totalIgv.toFixed(2)),
        total_gratuita: '',
        total_otros_cargos: dto.total_otros_cargos || '',
        total: parseFloat(total.toFixed(2)),
        percepcion_tipo: '',
        percepcion_base_imponible: '',
        total_percepcion: '',
        total_incluido_percepcion: '',
        retencion_tipo: '',
        retencion_base_imponible: '',
        total_retencion: '',
        detraccion: false,
        observaciones: dto.observaciones || '',
        documento_que_se_modifica_tipo: '',
        documento_que_se_modifica_serie: '',
        documento_que_se_modifica_numero: '',
        tipo_de_nota_de_credito: '',
        tipo_de_nota_de_debito: '',
        enviar_automaticamente_a_la_sunat: dto.enviar_automaticamente_a_la_sunat ?? true,
        enviar_automaticamente_al_cliente: dto.enviar_automaticamente_al_cliente ?? false,
        condiciones_de_pago: dto.condiciones_de_pago || '',
        medio_de_pago: dto.medio_de_pago || '',
        placa_vehiculo: '',
        orden_compra_servicio: '',
        formato_de_pdf: dto.formato_de_pdf || 'A4',
        generado_por_contingencia: '',
        bienes_region_selva: '',
        servicios_region_selva: '',
        items: items.map((i) => ({
          unidad_de_medida: i.dto.unidad_de_medida || i.producto.unidad_de_medida,
          codigo: i.dto.codigo || i.producto.codigo,
          codigo_producto_sunat: i.dto.codigo_producto_sunat || i.producto.codigo_producto_sunat,
          descripcion: i.dto.descripcion || i.producto.descripcion,
          cantidad: Number(i.dto.cantidad),
          valor_unitario: Number(i.dto.valor_unitario),
          precio_unitario: Number(i.dto.precio_unitario),
          descuento: i.dto.descuento || '',
          subtotal: Number(i.dto.subtotal),
          tipo_de_igv: i.dto.tipo_de_igv || i.producto.tipo_de_igv,
          igv: Number(i.dto.igv),
          total: Number(i.dto.total),
          anticipo_regularizacion: false,
          anticipo_documento_serie: '',
          anticipo_documento_numero: '',
        })),
      };

      let respuestaNubefact: any = {};
      if (dto.enviar_a_nubefact !== false) {
        try {
          respuestaNubefact = await this.nubefact.generarComprobante(payloadNubefact);
        } catch (e) {
          if (dto.guardar_sin_nubefact !== true) throw e;
        }
      }

      let factura;
      try {
        factura = await tx.factura.create({
          data: {
            userId,
            clienteId: cliente.id,
            operacion: 'generar_comprobante',
            tipo_de_comprobante: dto.tipo_de_comprobante,
            serie,
            numero,
            sunat_transaction: dto.sunat_transaction || 1,
            fecha_de_emision: dto.fecha_de_emision || new Date(),
            fecha_de_vencimiento: dto.fecha_de_vencimiento,
            moneda: dto.moneda || 1,
            tipo_de_cambio: dto.tipo_de_cambio,
            porcentaje_de_igv: dto.porcentaje_de_igv || 18.0,
            descuento_global: dto.descuento_global,
            total_descuento: dto.total_descuento,
            total_gravada: parseFloat(totalGravada.toFixed(2)),
            total_inafecta: totalInafecta > 0 ? parseFloat(totalInafecta.toFixed(2)) : dto.total_inafecta,
            total_exonerada: totalExonerada > 0 ? parseFloat(totalExonerada.toFixed(2)) : dto.total_exonerada,
            total_igv: parseFloat(totalIgv.toFixed(2)),
            total_otros_cargos: dto.total_otros_cargos,
            total: parseFloat(total.toFixed(2)),
            observaciones: dto.observaciones,
            condiciones_de_pago: dto.condiciones_de_pago,
            medio_de_pago: dto.medio_de_pago,
            formato_de_pdf: dto.formato_de_pdf || 'A4',
            enlace: respuestaNubefact.enlace,
            enlace_del_pdf: respuestaNubefact.enlace_del_pdf,
            enlace_del_xml: respuestaNubefact.enlace_del_xml,
            enlace_del_cdr: respuestaNubefact.enlace_del_cdr,
            aceptada_por_sunat: respuestaNubefact.aceptada_por_sunat || false,
            sunat_description: respuestaNubefact.sunat_description,
            sunat_responsecode: respuestaNubefact.sunat_responsecode,
            codigo_hash: respuestaNubefact.codigo_hash,
            cadena_para_codigo_qr: respuestaNubefact.cadena_para_codigo_qr,
            items: {
              create: items.map((i) => ({
                productoId: i.producto.id,
                unidad_de_medida: i.dto.unidad_de_medida || i.producto.unidad_de_medida,
                codigo: i.dto.codigo || i.producto.codigo,
                codigo_producto_sunat: i.dto.codigo_producto_sunat || i.producto.codigo_producto_sunat,
                descripcion: i.dto.descripcion || i.producto.descripcion,
                cantidad: Number(i.dto.cantidad),
                valor_unitario: Number(i.dto.valor_unitario),
                precio_unitario: Number(i.dto.precio_unitario),
                descuento: i.dto.descuento,
                subtotal: Number(i.dto.subtotal),
                tipo_de_igv: i.dto.tipo_de_igv || i.producto.tipo_de_igv,
                igv: Number(i.dto.igv),
                total: Number(i.dto.total),
              })),
            },
          },
          include: { cliente: true, items: true },
        });
      } catch (e) {
        if (e.code === 'P2002') {
          throw new BadRequestException(
            `Ya existe un comprobante con la serie ${serie} y número ${numero} para este usuario`,
          );
        }
        throw e;
      }

      return { factura, nubefact: respuestaNubefact };
    });
  }

  async findAll(userId: number, tipo?: number, anulado?: boolean) {
    const where: any = { userId };
    if (tipo !== undefined) where.tipo_de_comprobante = tipo;
    if (anulado !== undefined) where.anulado = anulado;
    return this.prisma.factura.findMany({
      where,
      include: { cliente: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: number, id: number) {
    const factura = await this.prisma.factura.findFirst({
      where: { id, userId },
      include: { cliente: true, items: true },
    });
    if (!factura) throw new NotFoundException('Factura no encontrada');
    return factura;
  }

  async consultarNubefact(userId: number, id: number) {
    const factura = await this.findOne(userId, id);
    const res = await this.nubefact.consultarComprobante(
      factura.tipo_de_comprobante,
      factura.serie,
      factura.numero,
    );
    await this.prisma.factura.update({
      where: { id: factura.id },
      data: {
        aceptada_por_sunat: res.aceptada_por_sunat,
        sunat_description: res.sunat_description,
        sunat_responsecode: res.sunat_responsecode,
        anulado: res.anulado || false,
        enlace_del_pdf: res.enlace_del_pdf,
        enlace_del_xml: res.enlace_del_xml,
        enlace_del_cdr: res.enlace_del_cdr,
      },
    });
    return res;
  }

  async anular(userId: number, id: number, dto: AnularFacturaDto) {
    const factura = await this.findOne(userId, id);
    if (factura.anulado) throw new BadRequestException('La factura ya está anulada');

    let resNubefact: any = {};
    if (dto.enviar_a_nubefact !== false) {
      resNubefact = await this.nubefact.generarAnulacion(
        factura.tipo_de_comprobante,
        factura.serie,
        factura.numero,
        dto.motivo,
      );
    }
    const actualizada = await this.prisma.factura.update({
      where: { id: factura.id },
      data: {
        anulado: true,
        motivo_anulacion: dto.motivo,
        fecha_anulacion: new Date(),
      },
      include: { cliente: true, items: true },
    });
    return { factura: actualizada, nubefact: resNubefact };
  }

  async consultarAnulacionNubefact(userId: number, id: number) {
    const factura = await this.findOne(userId, id);
    const res = await this.nubefact.consultarAnulacion(
      factura.tipo_de_comprobante,
      factura.serie,
      factura.numero,
    );
    const data: any = {};
    if (typeof res.anulado === 'boolean') data.anulado = res.anulado;
    if (res.sunat_description) data.sunat_description = res.sunat_description;
    if (res.sunat_responsecode) data.sunat_responsecode = res.sunat_responsecode;
    if (Object.keys(data).length) {
      await this.prisma.factura.update({ where: { id: factura.id }, data });
    }
    return res;
  }

  async getEstadisticas(userId: number) {
    const facturas = await this.prisma.factura.findMany({ where: { userId } });
    const totalFacturas = facturas.filter(f => f.tipo_de_comprobante === 1 && !f.anulado).length;
    const totalBoletas = facturas.filter(f => f.tipo_de_comprobante === 2 && !f.anulado).length;
    const totalAnuladas = facturas.filter(f => f.anulado).length;
    const montoTotal = facturas
      .filter(f => !f.anulado)
      .reduce((s, f) => s + Number(f.total), 0);
    const clientes = await this.prisma.cliente.count({ where: { userId } });
    const productos = await this.prisma.producto.count({ where: { userId, activo: true } });
    return {
      totalFacturas,
      totalBoletas,
      totalAnuladas,
      montoTotal,
      clientes,
      productos,
    };
  }
}