import { IsInt, IsArray, ValidateNested, IsString, IsIn, IsPositive, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class TransferItemDto {
    @IsInt()
    @IsPositive()
    id_producto: number;

    @IsInt()
    @IsPositive()
    cantidad: number;
}

export class CreateTransferDto {
    @IsInt()
    id_sucursal_origen: number;

    @IsInt()
    id_sucursal_destino: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TransferItemDto)
    items: TransferItemDto[];

    @IsString()
    @IsOptional()
    observaciones?: string;
}

export class UpdateTransferStatusDto {
    @IsString()
    @IsIn(['autorizado', 'rechazado'])
    estado: 'autorizado' | 'rechazado';
}
