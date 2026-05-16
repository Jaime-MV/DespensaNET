import { IsEmail, IsNumber, IsOptional, IsString, MinLength, IsBoolean } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsNumber()
  id_rol?: number;

  @IsOptional()
  @IsNumber()
  id_sucursal?: number;

  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsEmail()
  correo?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  contrasena?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
