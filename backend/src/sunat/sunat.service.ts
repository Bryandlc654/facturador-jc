import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

const APIPERU_URL = 'https://api.apiperu.dev/ruc';

@Injectable()
export class SunatService {
  private readonly token: string;

  constructor(private configService: ConfigService) {
    this.token = this.configService.get<string>('APIPERU_TOKEN', '');
  }

  async consultarRuc(ruc: string) {
    if (!this.token) {
      throw new HttpException(
        { message: 'Consulta RUC no configurada. Agrega APIPERU_TOKEN en el servidor.' },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    try {
      const response = await axios.post(
        APIPERU_URL,
        { ruc },
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`,
          },
        },
      );

      const body = response.data;
      if (!body.success) {
        throw new HttpException(
          { message: body.message || 'RUC no encontrado' },
          body.code === 'invalid_input' || body.code === 'document_not_found'
            ? HttpStatus.BAD_REQUEST
            : HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      return body.data;
    } catch (error) {
      if (error instanceof HttpException) throw error;

      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message;
        throw new HttpException(
          { message: message || 'Error al consultar el RUC' },
          status === 401 ? HttpStatus.UNAUTHORIZED : HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      throw new HttpException(
        { message: 'No se pudo conectar con API Peru' },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}