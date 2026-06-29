import { Injectable, Logger } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { NotificationsRepository } from './repositories/notifications.repository';
import { Notification } from './entities/notification.entity';
import { TipoNotificacion } from '../../common/types';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly repo: NotificationsRepository,
    @InjectEntityManager() private readonly em: EntityManager,
  ) {}

  // ── RF-07.1 — Notificar cuando alguien propone un trato ──────────────────────
  async notificarInteresEnPublicacion(params: {
    publicadorId: string;
    iniciadorNombre: string;
    publicacionId: string;
    tituloPublicacion: string;
  }): Promise<void> {
    try {
      await this.repo.crear({
        destinatarioId: params.publicadorId,
        tipo: TipoNotificacion.INTERES_EN_PUBLICACION,
        titulo: '¡Alguien está interesado en tu artículo!',
        mensaje: `${params.iniciadorNombre} ha propuesto un trato para tu publicación "${params.tituloPublicacion}".`,
        referenciaId: params.publicacionId,
        referenciaTipo: 'publicacion',
      });
    } catch (err) {
      this.logger.error('Error al crear notificación de interés', err);
    }
  }

  // ── RF-07.2 — Notificar cambio de estado en transacción ──────────────────────
  async notificarCambioEstadoTransaccion(params: {
    destinatarioId: string;
    titulo: string;
    mensaje: string;
    transaccionId: string;
  }): Promise<void> {
    try {
      await this.repo.crear({
        destinatarioId: params.destinatarioId,
        tipo: TipoNotificacion.CAMBIO_ESTADO_TRANSACCION,
        titulo: params.titulo,
        mensaje: params.mensaje,
        referenciaId: params.transaccionId,
        referenciaTipo: 'transaccion',
      });
    } catch (err) {
      this.logger.error('Error al crear notificación de estado', err);
    }
  }

  // ── RF-07.3 — Alertar cuando se publica en categoría favorita ────────────────
  async notificarCategoriaFavorita(params: {
    publicacionId: string;
    tituloPublicacion: string;
    categoria: string;
  }): Promise<void> {
    try {
      // Buscar todos los usuarios generales que tienen esta categoría como favorita
      const usuarios: { usuario_id: string }[] = await this.em.query(
        `SELECT usuario_id FROM perfiles_usuario_general
         WHERE $1 = ANY(categorias_favoritas)`,
        [params.categoria],
      );

      if (!usuarios || usuarios.length === 0) return;

      // Crear una notificación para cada usuario interesado
      await Promise.all(
        usuarios.map((u) =>
          this.repo.crear({
            destinatarioId: u.usuario_id,
            tipo: TipoNotificacion.NUEVA_PUBLICACION_FAVORITA,
            titulo: `¡Nuevo artículo en tu categoría favorita!`,
            mensaje: `Se publicó "${params.tituloPublicacion}" en la categoría "${params.categoria}" que tienes marcada como favorita.`,
            referenciaId: params.publicacionId,
            referenciaTipo: 'publicacion',
          }),
        ),
      );
    } catch (err) {
      this.logger.error('Error al crear notificación de categoría favorita', err);
    }
  }

  // ── Lectura y gestión ─────────────────────────────────────────────────────────
  async obtenerMisNotificaciones(usuarioId: string): Promise<Notification[]> {
    return this.repo.obtenerParaUsuario(usuarioId);
  }

  async contarNoLeidas(usuarioId: string): Promise<{ total: number }> {
    const total = await this.repo.contarNoLeidas(usuarioId);
    return { total };
  }

  async marcarLeida(id: string, usuarioId: string): Promise<Notification | null> {
    return this.repo.marcarComoLeida(id, usuarioId);
  }

  async marcarTodasLeidas(usuarioId: string): Promise<{ mensaje: string }> {
    await this.repo.marcarTodasComoLeidas(usuarioId);
    return { mensaje: 'Todas las notificaciones han sido marcadas como leídas.' };
  }
}
