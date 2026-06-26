import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extrae el usuario del JWT ya validado.
 * Disponible solo en endpoints protegidos con JwtAuthGuard.
 *
 * @example
 * login(@CurrentUser() user: { id: string; email: string; rol: string }) { ... }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    // Le pasamos un tipo genérico a getRequest para que no devuelva 'any'
    const request = ctx
      .switchToHttp()
      .getRequest<{ user: { id: string; email: string; rol: string } }>();
    return request.user;
  },
);
