import { Injectable, Logger } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { NotificationsRepository } from './repositories/notifications.repository';
import { Notification } from './entities/notification.entity';
import { TipoNotificacion, RolUsuario } from '../../common/types';

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
      this.logger.error(
        'Error al crear notificación de categoría favorita',
        err,
      );
    }
  }

  // ── RF-06 — Notificar cuando se recibe una calificación ──────────────────────
  async notificarCalificacionRecibida(params: {
    destinatarioId: string;
    calificadorNombre: string;
    puntuacion: number;
    transaccionId: string;
  }): Promise<void> {
    try {
      await this.repo.crear({
        destinatarioId: params.destinatarioId,
        tipo: TipoNotificacion.CALIFICACION_RECIBIDA,
        titulo: '¡Has recibido una nueva calificación!',
        mensaje: `${params.calificadorNombre} te ha calificado con ${params.puntuacion} estrellas.`,
        referenciaId: params.transaccionId,
        referenciaTipo: 'transaccion',
      });
    } catch (err) {
      this.logger.error(
        'Error al crear notificación de calificación recibida',
        err,
      );
    }
  }

  // ── RF-06 — Notificar a administradores sobre solicitud de verificación ───────
  async notificarSolicitudVerificacion(params: {
    reparadorNombre: string;
    solicitudId: string;
  }): Promise<void> {
    try {
      // Buscar todos los administradores en la BD
      const admins: { id: string }[] = await this.em.query(
        `SELECT id FROM usuarios WHERE rol = $1 AND activo = true`,
        [RolUsuario.ADMINISTRADOR],
      );

      if (!admins || admins.length === 0) return;

      // Crear una notificación para cada administrador
      await Promise.all(
        admins.map((admin) =>
          this.repo.crear({
            destinatarioId: admin.id,
            tipo: TipoNotificacion.SOLICITUD_VERIFICACION,
            titulo: 'Nueva solicitud de verificación',
            mensaje: `El reparador ${params.reparadorNombre} ha solicitado la verificación de su perfil.`,
            referenciaId: params.solicitudId,
            referenciaTipo: 'transaccion', // usamos 'transaccion' para redirecciones simples o genéricas en panel
          }),
        ),
      );
    } catch (err) {
      this.logger.error('Error al notificar solicitud de verificación', err);
    }
  }

  // ── RF-06 — Notificar a reparador sobre resultado de su verificación ─────────
  async notificarVerificacionRevisada(params: {
    reparadorId: string;
    aprobada: boolean;
    notasAdmin?: string;
    solicitudId: string;
  }): Promise<void> {
    try {
      const decision = params.aprobada ? 'aprobada' : 'rechazada';
      const titulo = params.aprobada
        ? '¡Tu solicitud de verificación fue aprobada!'
        : 'Tu solicitud de verificación fue rechazada';

      await this.repo.crear({
        destinatarioId: params.reparadorId,
        // Al no existir VERIFICACION_RECHAZADA en DB, usamos VERIFICACION_APROBADA o CAMBIO_ESTADO_TRANSACCION
        tipo: params.aprobada
          ? TipoNotificacion.VERIFICACION_APROBADA
          : TipoNotificacion.CAMBIO_ESTADO_TRANSACCION,
        titulo: titulo,
        mensaje: `El administrador ha ${decision} tu solicitud de verificación.${
          params.notasAdmin ? ` Motivo/Notas: ${params.notasAdmin}` : ''
        }`,
        referenciaId: params.solicitudId,
        referenciaTipo: 'transaccion',
      });
    } catch (err) {
      this.logger.error('Error al notificar resultado de verificación', err);
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

  async marcarLeida(
    id: string,
    usuarioId: string,
  ): Promise<Notification | null> {
    return this.repo.marcarComoLeida(id, usuarioId);
  }

  async marcarTodasLeidas(usuarioId: string): Promise<{ mensaje: string }> {
    await this.repo.marcarTodasComoLeidas(usuarioId);
    return {
      mensaje: 'Todas las notificaciones han sido marcadas como leídas.',
    };
  }
}
