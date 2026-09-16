import { BadRequestException } from '@nestjs/common';
import { FacturasService } from '../src/facturas/facturas.service';
import { NubefactService } from '../src/facturas/nubefact.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('FacturasService', () => {
  let service: FacturasService;
  let prisma: any;
  let nubefact: any;
  let tx: any;

  beforeEach(() => {
    tx = {
      cliente: { findFirst: jest.fn() },
      producto: { findFirst: jest.fn() },
      factura: { create: jest.fn() },
      $queryRaw: jest.fn(),
    };
    prisma = {
      $transaction: jest.fn((cb) => cb(tx)),
      factura: { findFirst: jest.fn(), update: jest.fn(), findMany: jest.fn() },
      cliente: { count: jest.fn() },
      producto: { count: jest.fn() },
    };
    nubefact = {
      generarComprobante: jest.fn().mockResolvedValue({}),
      consultarComprobante: jest.fn(),
      generarAnulacion: jest.fn(),
      consultarAnulacion: jest.fn(),
    };
    service = new FacturasService(prisma as PrismaService, nubefact as NubefactService);
  });

  describe('generate', () => {
    const cliente = {
      id: 1,
      tipo_de_documento: '6',
      numero_de_documento: '20111111111',
      denominacion: 'Cliente A',
    };

    it('separa totales gravada/exonerada/inafecta e IGV', async () => {
      tx.cliente.findFirst.mockResolvedValue(cliente);
      tx.producto.findFirst.mockResolvedValue({
        id: 1,
        codigo: 'P1',
        codigo_producto_sunat: '10000000',
        descripcion: 'P',
        unidad_de_medida: 'NIU',
        tipo_de_igv: 1,
      });
      tx.$queryRaw.mockResolvedValue([]);
      tx.factura.create.mockImplementation(async ({ data }) => ({ id: 1, ...data }));

      const dto: any = {
        clienteId: 1,
        tipo_de_comprobante: 1,
        items: [
          { productoId: 1, cantidad: 1, valor_unitario: 100, precio_unitario: 118, subtotal: 100, tipo_de_igv: 1, igv: 18, total: 118 },
          { productoId: 1, cantidad: 1, valor_unitario: 200, precio_unitario: 200, subtotal: 200, tipo_de_igv: 8, igv: 0, total: 200 },
          { productoId: 1, cantidad: 1, valor_unitario: 300, precio_unitario: 300, subtotal: 300, tipo_de_igv: 9, igv: 0, total: 300 },
        ],
      };

      const result = await service.generate(7, dto);

      const data = tx.factura.create.mock.calls[0][0].data;
      expect(data.total_gravada).toBe(100);
      expect(data.total_exonerada).toBe(200);
      expect(data.total_inafecta).toBe(300);
      expect(data.total_igv).toBe(18);
      expect(data.total).toBe(618);

      const payload = nubefact.generarComprobante.mock.calls[0][0];
      expect(payload.total_gravada).toBe(100);
      expect(payload.total_exonerada).toBe(200);
      expect(payload.total_inafecta).toBe(300);
      expect(payload.total_igv).toBe(18);
      expect(payload.total).toBe(618);

      expect(result.factura.id).toBe(1);
    });

    it('calcula el siguiente correlativo dentro de la misma transacción', async () => {
      tx.cliente.findFirst.mockResolvedValue(cliente);
      tx.producto.findFirst.mockResolvedValue({ id: 1, codigo: 'P1', descripcion: 'P', tipo_de_igv: 1 });
      tx.$queryRaw.mockResolvedValue([{ numero: 5 }]);
      tx.factura.create.mockImplementation(async ({ data }) => ({ id: 1, ...data }));

      await service.generate(7, { clienteId: 1, tipo_de_comprobante: 1, items: [] } as any);

      expect(tx.$queryRaw).toHaveBeenCalled();
      const data = tx.factura.create.mock.calls[0][0].data;
      expect(data.numero).toBe(6);
      expect(data.serie).toBe('F001');
    });

    it('lanza BadRequestException al duplicar serie-número (P2002)', async () => {
      tx.cliente.findFirst.mockResolvedValue(cliente);
      tx.producto.findFirst.mockResolvedValue({ id: 1, codigo: 'P1', descripcion: 'P', tipo_de_igv: 1 });
      tx.$queryRaw.mockResolvedValue([]);
      tx.factura.create.mockRejectedValue({ code: 'P2002' });

      await expect(
        service.generate(7, { clienteId: 1, tipo_de_comprobante: 1, items: [] } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('anular', () => {
    it('marca como anulada sin sobrescribir aceptada_por_sunat', async () => {
      prisma.factura.findFirst.mockResolvedValue({
        id: 1,
        userId: 7,
        anulado: false,
        tipo_de_comprobante: 1,
        serie: 'F001',
        numero: 1,
      });
      nubefact.generarAnulacion.mockResolvedValue({ aceptada_por_sunat: true });
      prisma.factura.update.mockImplementation(async ({ data }) => ({ id: 1, ...data }));

      const result = await service.anular(7, 1, { motivo: 'Error de sistema' } as any);

      expect(result.factura.anulado).toBe(true);
      expect(result.factura.motivo_anulacion).toBe('Error de sistema');
      const updateData = prisma.factura.update.mock.calls[0][0].data;
      expect(updateData).not.toHaveProperty('aceptada_por_sunat');
    });
  });

  describe('consultarAnulacionNubefact', () => {
    it('persiste el resultado de la anulación en la base de datos', async () => {
      prisma.factura.findFirst.mockResolvedValue({
        id: 1,
        userId: 7,
        tipo_de_comprobante: 1,
        serie: 'F001',
        numero: 1,
      });
      nubefact.consultarAnulacion.mockResolvedValue({ anulado: true, sunat_description: 'BAJA ACEPTADA' });
      prisma.factura.update.mockResolvedValue({ id: 1 });

      const res = await service.consultarAnulacionNubefact(7, 1);

      expect(res.anulado).toBe(true);
      expect(prisma.factura.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { anulado: true, sunat_description: 'BAJA ACEPTADA' },
      });
    });
  });
});