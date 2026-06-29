import { Notification } from '../entities/notification.entity';
import { TipoNotificacion } from '../../../common/types';

export abstract class NotificationsRepository {
  abstract crear(datos: {
    destinatarioId: string;
    tipo: TipoNotificacion;
    titulo: string;
    mensaje: string;
    referenciaId?: string;
    referenciaTipo?: string;
  }): Promise<Notification>;

  abstract obtenerParaUsuario(usuarioId: string): Promise<Notification[]>;

  abstract marcarComoLeida(id: string, usuarioId: string): Promise<Notification | null>;

  abstract marcarTodasComoLeidas(usuarioId: string): Promise<void>;

  abstract contarNoLeidas(usuarioId: string): Promise<number>;
}
