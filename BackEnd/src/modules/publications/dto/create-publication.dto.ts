import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsArray,
  Min,
  ValidateNested,
  Length,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ModalidadIntercambio } from '../../../common/types';

export class GeolocationDto {
  @IsNumber()
  @IsNotEmpty()
  latitud: number;

  @IsNumber()
  @IsNotEmpty()
  longitud: number;
}

export class ComponentDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 150)
  nombre: string;

  @IsBoolean()
  funcional: boolean;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  precioPieza?: number;
}

export class CreatePublicationDto {
  @IsString()
  @IsNotEmpty()
  @Length(5, 200)
  titulo: string;

  @IsString()
  @IsNotEmpty()
  @Length(10, 5000)
  descripcion: string;

  @IsString()
  @IsOptional()
  condition?: string;

  @IsString()
  @IsNotEmpty()
  categoria: string;

  @IsEnum(ModalidadIntercambio)
  modalidad: ModalidadIntercambio;

  @IsNumber()
  @IsOptional()
  @Min(0)
  precio?: number;

  @IsString()
  @IsOptional()
  @Length(3, 3)
  moneda?: string = 'MXN';

  @ValidateNested()
  @Type(() => GeolocationDto)
  ubicacion: GeolocationDto;

  @IsString()
  @IsOptional()
  direccionReferencia?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ComponentDto)
  componentes?: ComponentDto[];
}
