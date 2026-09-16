import { IsString, Matches } from 'class-validator';

export class ConsultRucDto {
  @IsString()
  @Matches(/^\d{11}$/, { message: 'El RUC debe tener 11 dígitos' })
  ruc: string;
}