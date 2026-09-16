import { IsString, IsNumber, IsOptional, IsInt, IsBoolean, IsDecimal } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductoDto {
  @IsString() codigo: string;
  @IsOptional() @IsString() codigo_producto_sunat?: string;
  @IsString() descripcion: string;
  @IsOptional() @IsString() unidad_de_medida?: string;
  @Type(() => Number) @IsNumber() valor_unitario: number;
  @Type(() => Number) @IsNumber() precio_unitario: number;
  @IsOptional() @Type(() => Number) @IsInt() tipo_de_igv?: number;
  @IsOptional() @Type(() => Number) @IsInt() stock?: number;
  @IsOptional() @IsBoolean() activo?: boolean;
}

export class UpdateProductoDto {
  @IsOptional() @IsString() codigo?: string;
  @IsOptional() @IsString() codigo_producto_sunat?: string;
  @IsOptional() @IsString() descripcion?: string;
  @IsOptional() @IsString() unidad_de_medida?: string;
  @IsOptional() @Type(() => Number) @IsNumber() valor_unitario?: number;
  @IsOptional() @Type(() => Number) @IsNumber() precio_unitario?: number;
  @IsOptional() @Type(() => Number) @IsInt() tipo_de_igv?: number;
  @IsOptional() @Type(() => Number) @IsInt() stock?: number;
  @IsOptional() @IsBoolean() activo?: boolean;
}
