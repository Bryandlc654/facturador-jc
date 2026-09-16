import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClienteDto, UpdateClienteDto } from './clientes.dto';

@Injectable()
export class ClientesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, createClienteDto: CreateClienteDto) {
    try {
      return await this.prisma.cliente.create({
        data: { ...createClienteDto, userId },
      });
    } catch (e) {
      if (e.code === 'P2002') throw new ConflictException('El cliente con este documento ya existe');
      throw e;
    }
  }

  async findAll(userId: number, search?: string) {
    const where: any = { userId };
    if (search) {
      where.OR = [
        { denominacion: { contains: search, mode: 'insensitive' } },
        { numero_de_documento: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.cliente.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async findOne(userId: number, id: number) {
    const cliente = await this.prisma.cliente.findFirst({ where: { id, userId } });
    if (!cliente) throw new NotFoundException('Cliente no encontrado');
    return cliente;
  }

  async update(userId: number, id: number, updateClienteDto: UpdateClienteDto) {
    await this.findOne(userId, id);
    return this.prisma.cliente.update({ where: { id }, data: updateClienteDto });
  }

  async remove(userId: number, id: number) {
    await this.findOne(userId, id);
    return this.prisma.cliente.delete({ where: { id } });
  }
}
