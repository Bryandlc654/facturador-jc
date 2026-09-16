import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductoDto, UpdateProductoDto } from './productos.dto';

@Injectable()
export class ProductosService {
  constructor(private prisma: PrismaService) {}

  create(userId: number, createProductoDto: CreateProductoDto) {
    return this.prisma.producto.create({
      data: { ...createProductoDto, userId },
    });
  }

  async findAll(userId: number, search?: string, activo?: boolean) {
    const where: any = { userId };
    if (search) {
      where.OR = [
        { descripcion: { contains: search, mode: 'insensitive' } },
        { codigo: { contains: search } },
      ];
    }
    if (activo !== undefined) where.activo = activo;
    return this.prisma.producto.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async findOne(userId: number, id: number) {
    const producto = await this.prisma.producto.findFirst({ where: { id, userId } });
    if (!producto) throw new NotFoundException('Producto no encontrado');
    return producto;
  }

  async update(userId: number, id: number, updateProductoDto: UpdateProductoDto) {
    await this.findOne(userId, id);
    return this.prisma.producto.update({ where: { id }, data: updateProductoDto });
  }

  async remove(userId: number, id: number) {
    await this.findOne(userId, id);
    return this.prisma.producto.delete({ where: { id } });
  }
}
