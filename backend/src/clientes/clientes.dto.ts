import { IsString, IsEmail, IsOptional, Length } from 'class-validator';

export class CreateClienteDto {
  @IsOptional() @IsString() tipo_de_documento?: string;
  @IsString() @Length(1, 15) numero_de_documento: string;
  @IsString() @Length(1, 100) denominacion: string;
  @IsOptional() @IsString() direccion?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() telefono?: string;
}

export class UpdateClienteDto {
  @IsOptional() @IsString() tipo_de_documento?: string;
  @IsOptional() @IsString() numero_de_documento?: string;
  @IsOptional() @IsString() denominacion?: string;
  @IsOptional() @IsString() direccion?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() telefono?: string;
}
