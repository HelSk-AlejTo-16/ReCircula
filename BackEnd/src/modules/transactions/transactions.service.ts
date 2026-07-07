import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TransactionsRepository } from './repositories/transactions.repository';
import { PublicationsRepository } from '../publications/repositories/publications.repository';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Transaction } from './entities/transaction.entity';
import {
  EstadoTransaccion,
  EstadoPublicacion,
  ModalidadIntercambio,
} from '../../common/types';
import {
  TransactionProposedEvent,
  TransactionAcceptedEvent,
  TransactionCanceledEvent,
  TransactionCompletedEvent,
} from '../../common/events';

@Injectable()
export class TransactionsService {
  /**
   * Patrones de Diseño Utilizados:
   * 1. Dependency Injection (Inyección de Dependencias): Las dependencias del servicio se declaran
   *    en el constructor y son provistas automáticamente por el contenedor de inversión de control (IoC) de NestJS.
   * 2. Repository Pattern (Patrón Repositorio): Todas las operaciones de persistencia e inserción
   *    de datos se delegan en TransactionsRepository y PublicationsRepository, aislando la lógica de negocio.
   */
  constructor(
    private readonly repo: TransactionsRepository,
    private readonly publicationsRepo: PublicationsRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async proponer(
    dto: CreateTransactionDto,
    iniciadorId: string,
  ): Promise<Transaction> {
    const pub = await this.publicationsRepo.findById(dto.publicacionId);
    if (!pub) {
      throw new NotFoundException('La publicación especificada no existe');
    }

    if (pub.estado !== EstadoPublicacion.PUBLICADO) {
      throw new BadRequestException(
        'La publicación no está disponible para intercambio',
      );
    }

    if (pub.publicadorId === iniciadorId) {
      throw new BadRequestException(
        'No puedes proponer un intercambio sobre tu propia publicación',
      );
    }

    // Si la modalidad exige precio, validarlo
    if (
      (dto.modalidad === ModalidadIntercambio.VENTA ||
        dto.modalidad === ModalidadIntercambio.VENTA_PIEZAS) &&
      (dto.precioAcordado === undefined || dto.precioAcordado === null)
    ) {
      throw new BadRequestException(
        'Debes especificar un precio acordado para esta modalidad',
      );
    }

    const tx = await this.repo.create({
      publicacionId: dto.publicacionId,
      iniciadorId,
      receptorId: pub.publicadorId,
      modalidad: dto.modalidad,
      estado: EstadoTransaccion.PENDIENTE,
      precioAcordado: dto.precioAcordado ?? null,
      confirmacionIniciador: false,
      confirmacionReceptor: false,
      notas: dto.notas ?? null,
    });

    // Guardar log de auditoría
    await this.repo.saveAuditLog({
      transaccionId: tx.id,
      estadoAnterior: null,
      estadoNuevo: EstadoTransaccion.PENDIENTE,
      usuarioResponsableId: iniciadorId,
      notas: 'Trato propuesto',
    });

    // Emitir evento de propuesta de trato (EDA)
    const txConRelaciones = await this.repo.findById(tx.id);
    this.eventEmitter.emit(
      'transaction.proposed',
      new TransactionProposedEvent(
        pub.publicadorId,
        txConRelaciones?.iniciador?.nombre ?? 'Un usuario',
        pub.id,
        pub.titulo,
      ),
    );

    return tx;
  }

  async buscarPorId(id: string, usuarioId: string): Promise<Transaction> {
    const tx = await this.repo.findById(id);
    if (!tx) {
      throw new NotFoundException('Transacción no encontrada');
    }

    if (tx.iniciadorId !== usuarioId && tx.receptorId !== usuarioId) {
      throw new ForbiddenException(
        'No tienes permiso para ver esta transacción',
      );
    }

    return tx;
  }

  async buscarTodasParaUsuario(usuarioId: string): Promise<Transaction[]> {
    return this.repo.findAllForUser(usuarioId);
  }

  async aceptar(id: string, usuarioId: string): Promise<Transaction> {
    const tx = await this.repo.findById(id);
    if (!tx) {
      throw new NotFoundException('Transacción no encontrada');
    }

    if (tx.receptorId !== usuarioId) {
      throw new ForbiddenException(
        'Solo el destinatario del trato puede aceptarlo',
      );
    }

    if (tx.estado !== EstadoTransaccion.PENDIENTE) {
      throw new BadRequestException('La transacción no está pendiente');
    }

    const estadoAnterior = tx.estado;
    tx.estado = EstadoTransaccion.EN_PROCESO;
    const guardada = await this.repo.save(tx);

    // Cambiar estado de la publicación a RESERVADO
    await this.publicationsRepo.update(tx.publicacionId, {
      estado: EstadoPublicacion.RESERVADO,
    });

    // Auditoría
    await this.repo.saveAuditLog({
      transaccionId: tx.id,
      estadoAnterior,
      estadoNuevo: EstadoTransaccion.EN_PROCESO,
      usuarioResponsableId: usuarioId,
      notas: 'Trato aceptado, publicación reservada',
    });

    // Emitir evento de trato aceptado (EDA)
    this.eventEmitter.emit(
      'transaction.accepted',
      new TransactionAcceptedEvent(tx.iniciadorId, tx.id),
    );

    return guardada;
  }

  async cancelar(
    id: string,
    usuarioId: string,
    notas?: string,
  ): Promise<Transaction> {
    const tx = await this.repo.findById(id);
    if (!tx) {
      throw new NotFoundException('Transacción no encontrada');
    }

    if (tx.iniciadorId !== usuarioId && tx.receptorId !== usuarioId) {
      throw new ForbiddenException(
        'No tienes permiso para cancelar esta transacción',
      );
    }

    if (
      tx.estado === EstadoTransaccion.COMPLETADA ||
      tx.estado === EstadoTransaccion.CANCELADA
    ) {
      throw new BadRequestException(
        'No se puede cancelar una transacción completada o ya cancelada',
      );
    }

    const estadoAnterior = tx.estado;
    tx.estado = EstadoTransaccion.CANCELADA;
    const guardada = await this.repo.save(tx);

    // Si estaba EN_PROCESO, liberar la publicación cambiándola a PUBLICADO
    if (estadoAnterior === EstadoTransaccion.EN_PROCESO) {
      await this.publicationsRepo.update(tx.publicacionId, {
        estado: EstadoPublicacion.PUBLICADO,
      });
    }

    // Auditoría
    await this.repo.saveAuditLog({
      transaccionId: tx.id,
      estadoAnterior,
      estadoNuevo: EstadoTransaccion.CANCELADA,
      usuarioResponsableId: usuarioId,
      notas: notas || 'Trato cancelado',
    });

    // Emitir evento de trato cancelado (EDA)
    const otroUsuarioId =
      usuarioId === tx.iniciadorId ? tx.receptorId : tx.iniciadorId;
    this.eventEmitter.emit(
      'transaction.canceled',
      new TransactionCanceledEvent(otroUsuarioId, tx.id, notas),
    );

    return guardada;
  }

  async confirmar(id: string, usuarioId: string): Promise<Transaction> {
    const tx = await this.repo.findById(id);
    if (!tx) {
      throw new NotFoundException('Transacción no encontrada');
    }

    if (tx.iniciadorId !== usuarioId && tx.receptorId !== usuarioId) {
      throw new ForbiddenException(
        'No tienes permiso para confirmar esta transacción',
      );
    }

    if (tx.estado !== EstadoTransaccion.EN_PROCESO) {
      throw new BadRequestException(
        'El trato debe estar en proceso para poder confirmar la entrega',
      );
    }

    if (usuarioId === tx.iniciadorId) {
      tx.confirmacionIniciador = true;
    } else {
      tx.confirmacionReceptor = true;
    }

    let guardada = await this.repo.save(tx);

    // Si ambos confirmaron, completar transacción
    if (guardada.confirmacionIniciador && guardada.confirmacionReceptor) {
      guardada.estado = EstadoTransaccion.COMPLETADA;
      guardada.fechaCompletada = new Date();
      guardada = await this.repo.save(guardada);

      // Cambiar estado de la publicación a INTERCAMBIADO
      await this.publicationsRepo.update(guardada.publicacionId, {
        estado: EstadoPublicacion.INTERCAMBIADO,
      });

      // Auditoría de completada
      await this.repo.saveAuditLog({
        transaccionId: guardada.id,
        estadoAnterior: EstadoTransaccion.EN_PROCESO,
        estadoNuevo: EstadoTransaccion.COMPLETADA,
        usuarioResponsableId: usuarioId,
        notas: 'Ambas partes confirmaron la recepción. Intercambio completado.',
      });

      // Emitir evento de trato completado (EDA)
      this.eventEmitter.emit(
        'transaction.completed',
        new TransactionCompletedEvent(
          guardada.id,
          guardada.publicacionId,
          guardada.iniciadorId,
          guardada.receptorId,
          guardada.modalidad,
        ),
      );
    } else {
      // Auditoría de confirmación parcial (mismo estado)
      await this.repo.saveAuditLog({
        transaccionId: guardada.id,
        estadoAnterior: EstadoTransaccion.EN_PROCESO,
        estadoNuevo: EstadoTransaccion.EN_PROCESO,
        usuarioResponsableId: usuarioId,
        notas: `El usuario ${usuarioId === tx.iniciadorId ? 'iniciador' : 'receptor'} confirmó recepción. Pendiente otra parte.`,
      });
    }

    return guardada;
  }
}
