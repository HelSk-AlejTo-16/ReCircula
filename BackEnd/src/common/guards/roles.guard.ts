import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolUsuario } from '../../modules/identity/entities/usuario.entity';

export const ROLES_KEY = 'roles';

/**
 * RF-01.4 — Diferencia permisos por rol.
 * Usar siempre después de JwtAuthGuard (necesita req.user ya poblado).
 *
 * @example
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles(RolUsuario.ADMINISTRADOR)
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const rolesRequeridos = this.reflector.getAllAndOverride<RolUsuario[]>(
      ROLES_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );

    if (!rolesRequeridos || rolesRequeridos.length === 0) return true;

    // Evitamos el 'any' tipando el request desde el inicio
    const request = ctx
      .switchToHttp()
      .getRequest<{ user?: { rol: RolUsuario } }>();

    // Y verificamos de forma segura
    return rolesRequeridos.includes(request.user?.rol as RolUsuario);
  }
}
