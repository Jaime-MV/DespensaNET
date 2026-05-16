import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsNumber()
  id_rol: number;

  @IsOptional()
  @IsNumber()
  id_sucursal?: number;

  @IsNotEmpty()
  @IsString()
  nombre: string;

  @IsNotEmpty()
  @IsEmail()
  correo: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  contrasena: string;
}
