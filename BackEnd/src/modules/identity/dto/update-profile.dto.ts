import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({
    example: 'Juan Pérez Editado',
    description: 'Nombre completo del usuario',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(150)
  nombre?: string;

  @ApiProperty({
    example: 'nuevo@correo.com',
    description: 'Correo electrónico del usuario',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  email?: string;
}
