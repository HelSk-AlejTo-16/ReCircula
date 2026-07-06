import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Notification } from '../entities/notification.entity';
import { NotificationsRepository } from './notifications.repository';
import { TipoNotificacion } from '../../../common/types';

@Injectable()
export class TypeOrmNotificationsRepository implements NotificationsRepository {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async crear(datos: {
    destinatarioId: string;
    tipo: TipoNotificacion;
    titulo: string;
    mensaje: string;
    referenciaId?: string;
    referenciaTipo?: string;
  }): Promise<Notification> {
    const notif = this.repo.create({
      destinatarioId: datos.destinatarioId,
      tipo: datos.tipo,
      titulo: datos.titulo,
      mensaje: datos.mensaje,
      referenciaId: datos.referenciaId ?? null,
      referenciaTipo: datos.referenciaTipo ?? null,
      leida: false,
      fechaLectura: null,
    });
    const saved = await this.repo.save(notif);

    // Emitimos el evento para SSE
    this.eventEmitter.emit('notification.created', saved);

    return saved;
  }

  async obtenerParaUsuario(usuarioId: string): Promise<Notification[]> {
    return this.repo.find({
      where: { destinatarioId: usuarioId },
      order: { fechaCreacion: 'DESC' },
    });
  }

  async marcarComoLeida(
    id: string,
    usuarioId: string,
  ): Promise<Notification | null> {
    const notif = await this.repo.findOne({
      where: { id, destinatarioId: usuarioId },
    });
    if (!notif) return null;

    notif.leida = true;
    notif.fechaLectura = new Date();
    return this.repo.save(notif);
  }

  async marcarTodasComoLeidas(usuarioId: string): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update(Notification)
      .set({ leida: true, fechaLectura: new Date() })
      .where('destinatario_id = :usuarioId AND leida = false', { usuarioId })
      .execute();
  }

  async contarNoLeidas(usuarioId: string): Promise<number> {
    return this.repo.count({
      where: { destinatarioId: usuarioId, leida: false },
    });
  }
}
