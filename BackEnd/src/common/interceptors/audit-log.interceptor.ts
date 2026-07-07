import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger('AuditLog');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, body } = request;
    const usuarioId = user?.id || 'ANÓNIMO';
    const timestamp = new Date().toISOString();

    // Clonamos el body para redactar datos personales sensibles y evitar fugas en logs
    let bodyRedactado: Record<string, any> | null = null;
    if (body && typeof body === 'object') {
      bodyRedactado = { ...body };
      const camposSensibles = [
        'password',
        'email',
        'nombre',
        'passwordConfirm',
        'contraseña',
        'password_hash',
        'direccionReferencia',
        'direccion',
        'evidencias', // PDFs u otros documentos personales
      ];

      for (const key of Object.keys(bodyRedactado)) {
        if (camposSensibles.includes(key)) {
          bodyRedactado[key] = '[REDACTADO_PRIVACIDAD]';
        }
      }
    }

    return next.handle().pipe(
      tap(() => {
        const bodyStr =
          bodyRedactado && Object.keys(bodyRedactado).length > 0
            ? ` | Body: ${JSON.stringify(bodyRedactado)}`
            : '';
        this.logger.log(
          `[AUDITORÍA] Usuario: ${usuarioId} | Acción: ${method} ${url} | Fecha: ${timestamp}${bodyStr}`,
        );
      }),
    );
  }
}
