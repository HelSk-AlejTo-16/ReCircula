import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger('AuditLog');

  constructor(
    @InjectEntityManager()
    private readonly em: EntityManager,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = (request.method || 'GET') as string;
    const url = (request.url || '') as string;
    const user = request.user;
    const body = request.body;
    const usuarioId = user?.id || 'ANÓNIMO';
    const timestamp = new Date().toISOString();

    // 1. Filtrado de Logs: Solo auditamos modificaciones o accesos a datos personales/sensibles
    const esModificacion = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    const accedeDatosPersonales =
      url.includes('arco') ||
      url.includes('identity') ||
      url.includes('notifications') ||
      url.includes('transactions');

    if (!esModificacion && !accedeDatosPersonales) {
      return next.handle();
    }

    // 2. Generar descripción humana ("para qué" se accedió)
    const urlLower = url.toLowerCase();
    let descripcionAccion = '';

    if (urlLower.includes('/identity/login')) {
      descripcionAccion = 'Inicio de sesión (Autenticación)';
    } else if (urlLower.includes('/identity/register')) {
      descripcionAccion = 'Registro de nuevo usuario';
    } else if (
      urlLower.includes('/identity/me') ||
      urlLower.includes('/identity/profile')
    ) {
      descripcionAccion =
        method === 'GET'
          ? 'Consulta de perfil de usuario'
          : 'Actualización de perfil de usuario';
    } else if (urlLower.includes('/arco')) {
      if (method === 'GET') {
        descripcionAccion = 'Consulta de solicitudes ARCO';
      } else if (method === 'POST') {
        descripcionAccion = 'Creación de solicitud ARCO';
      } else {
        descripcionAccion = 'Actualización/Resolución de solicitud ARCO';
      }
    } else if (urlLower.includes('/publications')) {
      if (method === 'POST') {
        descripcionAccion = 'Creación de publicación (Subida de artículo)';
      } else if (method === 'PATCH' || method === 'PUT') {
        descripcionAccion = 'Modificación de publicación';
      } else if (method === 'DELETE') {
        descripcionAccion = 'Eliminación/Archivado de publicación';
      } else {
        descripcionAccion = 'Acceso a publicación detallada';
      }
    } else if (urlLower.includes('/notifications')) {
      descripcionAccion =
        method === 'GET'
          ? 'Lectura/Consulta de notificaciones'
          : 'Modificación de notificaciones';
    } else if (urlLower.includes('/transactions')) {
      if (method === 'POST') {
        descripcionAccion = 'Inicio de transacción/intercambio';
      } else {
        descripcionAccion = 'Gestión/Consulta de transacción';
      }
    } else {
      descripcionAccion = `${method} ${url}`;
    }

    // Clonamos el body para redactar datos personales sensibles y evitar fugas en logs
    let bodyRedactado: Record<string, any> | null = null;
    if (body && typeof body === 'object') {
      const redacted: Record<string, any> = { ...body };
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

      for (const key of Object.keys(redacted)) {
        if (camposSensibles.includes(key)) {
          redacted[key] = '[REDACTADO_PRIVACIDAD]';
        }
      }
      bodyRedactado = redacted;
    }

    return next.handle().pipe(
      tap(() => {
        const bodyKeys = bodyRedactado ? Object.keys(bodyRedactado) : [];
        const bodyStr =
          bodyKeys.length > 0
            ? ` | Body: ${JSON.stringify(bodyRedactado)}`
            : '';
        this.logger.log(
          `[AUDITORÍA] Usuario: ${usuarioId} | Acción: ${descripcionAccion} (${method} ${url}) | Fecha: ${timestamp}${bodyStr}`,
        );

        // Guardar log en la base de datos de forma asíncrona
        this.em
          .query(
            `INSERT INTO logs_auditoria (usuario_id, accion, descripcion, ip_origen)
             VALUES ($1, $2, $3, $4)`,
            [
              usuarioId === 'ANÓNIMO' ? null : usuarioId,
              `${method} ${url}`,
              bodyStr
                ? `${descripcionAccion} - Parámetros: ${JSON.stringify(bodyRedactado)}`
                : descripcionAccion,
              request.ip || null,
            ],
          )
          .catch((err) => {
            this.logger.error(
              'Error al guardar log de auditoría en la base de datos',
              err,
            );
          });
      }),
    );
  }
}
