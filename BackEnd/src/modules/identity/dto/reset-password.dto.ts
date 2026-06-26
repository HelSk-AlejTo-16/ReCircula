import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token recibido en el correo de recuperación' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'NuevaPassword123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  nuevaPassword: string;
}
