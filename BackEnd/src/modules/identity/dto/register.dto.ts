import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RolUsuario } from '../entities/usuario.entity';

export class RegisterDto {
  @ApiProperty({ example: 'María García' })
  @IsString()
  @MaxLength(150)
  nombre: string;

  @ApiProperty({ example: 'maria@ejemplo.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'MiPassword123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: RolUsuario, example: RolUsuario.USUARIO_GENERAL })
  @IsEnum(RolUsuario)
  rol: RolUsuario;

  @ApiProperty({ example: true })
  @IsBoolean()
  aceptaTransferenciasTerceros: boolean;
}
