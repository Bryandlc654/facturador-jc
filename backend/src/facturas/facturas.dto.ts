import { IsString, IsInt, IsNumber, IsOptional, IsBoolean, IsArray, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

class FacturaItemDto {
  @IsInt() productoId: number;
  @IsOptional() @IsString() unidad_de_medida?: string;
  @IsOptional() @IsString() codigo?: string;
  @IsOptional() @IsString() codigo_producto_sunat?: string;
  @IsOptional() @IsString() descripcion?: string;
  @Type(() => Number) @IsNumber() cantidad: number;
  @Type(() => Number) @IsNumber() valor_unitario: number;
  @Type(() => Number) @IsNumber() precio_unitario: number;
  @IsOptional() @Type(() => Number) @IsNumber() descuento?: number;
  @Type(() => Number) @IsNumber() subtotal: number;
  @IsOptional() @IsInt() tipo_de_igv?: number;
  @Type(() => Number) @IsNumber() igv: number;
  @Type(() => Number) @IsNumber() total: number;
}

export class CreateFacturaDto {
  @IsInt() clienteId: number;
  @IsInt() tipo_de_comprobante: number;
  @IsOptional() @IsString() serie?: string;
  @IsOptional() @IsInt() numero?: number;
  @IsOptional() @IsInt() sunat_transaction?: number;
  @IsOptional() @IsDateString() fecha_de_emision?: Date;
  @IsOptional() @IsDateString() fecha_de_vencimiento?: Date;
  @IsOptional() @IsInt() moneda?: number;
  @IsOptional() @Type(() => Number) @IsNumber() tipo_de_cambio?: number;
  @IsOptional() @Type(() => Number) @IsNumber() porcentaje_de_igv?: number;
  @IsOptional() @Type(() => Number) @IsNumber() descuento_global?: number;
  @IsOptional() @Type(() => Number) @IsNumber() total_descuento?: number;
  @IsOptional() @Type(() => Number) @IsNumber() total_inafecta?: number;
  @IsOptional() @Type(() => Number) @IsNumber() total_exonerada?: number;
  @IsOptional() @Type(() => Number) @IsNumber() total_otros_cargos?: number;
  @IsOptional() @IsString() observaciones?: string;
  @IsOptional() @IsString() condiciones_de_pago?: string;
  @IsOptional() @IsString() medio_de_pago?: string;
  @IsOptional() @IsString() formato_de_pdf?: string;
  @IsOptional() @IsBoolean() enviar_automaticamente_a_la_sunat?: boolean;
  @IsOptional() @IsBoolean() enviar_automaticamente_al_cliente?: boolean;
  @IsOptional() @IsBoolean() enviar_a_nubefact?: boolean;
  @IsOptional() @IsBoolean() guardar_sin_nubefact?: boolean;
  @IsArray() @ValidateNested({ each: true }) @Type(() => FacturaItemDto) items: FacturaItemDto[];
}

export class AnularFacturaDto {
  @IsString() motivo: string;
  @IsOptional() @IsBoolean() enviar_a_nubefact?: boolean;
}
