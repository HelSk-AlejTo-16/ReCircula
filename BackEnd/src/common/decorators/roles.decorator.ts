import { SetMetadata } from '@nestjs/common';
import { RolUsuario } from '../../modules/identity/entities/usuario.entity';
import { ROLES_KEY } from '../guards/roles.guard';

/**
 * Marca un endpoint como accesible solo para los roles indicados.
 * Combinar siempre con JwtAuthGuard y RolesGuard.
 *
 * @example
 * @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.REPARADOR_VERIFICADO)
 */
export const Roles = (...roles: RolUsuario[]) => SetMetadata(ROLES_KEY, roles);
