import {
  IsUUID,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ModalidadIntercambio } from '../../../common/types';

export class CreateTransactionDto {
  @IsUUID()
  @IsNotEmpty()
  publicacionId: string;

  @IsEnum(ModalidadIntercambio)
  @IsNotEmpty()
  modalidad: ModalidadIntercambio;

  @IsNumber()
  @Min(0)
  @IsOptional()
  precioAcordado?: number;

  @IsString()
  @IsOptional()
  notas?: string;
}
