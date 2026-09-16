import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class NubefactService {
  private readonly apiUrl: string;
  private readonly token: string;

  constructor(private configService: ConfigService) {
    this.apiUrl = this.configService.get<string>('NUBEFACT_API_URL', '');
    this.token = this.configService.get<string>('NUBEFACT_TOKEN', '');
  }

  async sendToNubefact(data: any): Promise<any> {
    try {
      const response = await axios.post(this.apiUrl, data, {
        headers: {
          Authorization: this.token,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new HttpException(
          error.response.data || { errors: 'Error en NubeFact', codigo: 50 },
          error.response.status || HttpStatus.BAD_REQUEST,
        );
      }
      throw new HttpException(
        { errors: 'No se pudo conectar con NubeFact', codigo: 50 },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async generarComprobante(data: any): Promise<any> {
    const payload = { operacion: 'generar_comprobante', ...data };
    return this.sendToNubefact(payload);
  }

  async consultarComprobante(tipo: number, serie: string, numero: number): Promise<any> {
    const payload = {
      operacion: 'consultar_comprobante',
      tipo_de_comprobante: tipo,
      serie,
      numero,
    };
    return this.sendToNubefact(payload);
  }

  async generarAnulacion(tipo: number, serie: string, numero: number, motivo: string): Promise<any> {
    const payload = {
      operacion: 'generar_anulacion',
      tipo_de_comprobante: tipo,
      serie,
      numero,
      motivo,
    };
    return this.sendToNubefact(payload);
  }

  async consultarAnulacion(tipo: number, serie: string, numero: number): Promise<any> {
    const payload = {
      operacion: 'consultar_anulacion',
      tipo_de_comprobante: tipo,
      serie,
      numero,
    };
    return this.sendToNubefact(payload);
  }
}
