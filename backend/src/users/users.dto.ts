import { IsString, IsEmail, IsOptional, IsBoolean } from 'class-validator';

export class CreateUserDto {
  @IsEmail() email: string;
  @IsString() password: string;
  @IsString() nombre: string;
  @IsString() apellido: string;
  @IsOptional() @IsString() role?: string;
}

export class UpdateUserDto {
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() nombre?: string;
  @IsOptional() @IsString() apellido?: string;
  @IsOptional() @IsString() role?: string;
  @IsOptional() @IsBoolean() activo?: boolean;
}
