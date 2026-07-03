import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from './notifications.service';
import {
  TransactionProposedEvent,
  TransactionAcceptedEvent,
  TransactionCanceledEvent,
  TransactionCompletedEvent,
  PublicationCreatedEvent,
  ReputationRatingCreatedEvent,
  ReputationVerificationRequestedEvent,
  ReputationVerificationReviewedEvent,
} from '../../common/events';

@Injectable()
export class NotificationsListener {
  private readonly logger = new Logger(NotificationsListener.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @OnEvent('transaction.proposed')
  async handleTransactionProposed(event: TransactionProposedEvent) {
    try {
      await this.notificationsService.notificarInteresEnPublicacion({
        publicadorId: event.publicadorId,
        iniciadorNombre: event.iniciadorNombre,
        publicacionId: event.publicacionId,
        tituloPublicacion: event.tituloPublicacion,
      });
    } catch (err) {
      this.logger.error('Error al manejar evento transaction.proposed', err);
    }
  }

  @OnEvent('transaction.accepted')
  async handleTransactionAccepted(event: TransactionAcceptedEvent) {
    try {
      await this.notificationsService.notificarCambioEstadoTransaccion({
        destinatarioId: event.iniciadorId,
        titulo: '¡Tu propuesta de trato fue aceptada!',
        mensaje:
          'Tu propuesta ha sido aceptada. El artículo está reservado y el trato está en proceso.',
        transaccionId: event.transaccionId,
      });
    } catch (err) {
      this.logger.error('Error al manejar evento transaction.accepted', err);
    }
  }

  @OnEvent('transaction.canceled')
  async handleTransactionCanceled(event: TransactionCanceledEvent) {
    try {
      await this.notificationsService.notificarCambioEstadoTransaccion({
        destinatarioId: event.destinatarioId,
        titulo: 'Trato cancelado',
        mensaje: `El trato ha sido cancelado.${event.notas ? ` Motivo: ${event.notas}` : ''}`,
        transaccionId: event.transaccionId,
      });
    } catch (err) {
      this.logger.error('Error al manejar evento transaction.canceled', err);
    }
  }

  @OnEvent('transaction.completed')
  async handleTransactionCompleted(event: TransactionCompletedEvent) {
    try {
      await Promise.all([
        this.notificationsService.notificarCambioEstadoTransaccion({
          destinatarioId: event.iniciadorId,
          titulo: '¡Trato completado exitosamente!',
          mensaje:
            'El intercambio fue confirmado por ambas partes. ¡Gracias por usar ReCircula!',
          transaccionId: event.transaccionId,
        }),
        this.notificationsService.notificarCambioEstadoTransaccion({
          destinatarioId: event.receptorId,
          titulo: '¡Trato completado exitosamente!',
          mensaje:
            'El intercambio fue confirmado por ambas partes. ¡Gracias por usar ReCircula!',
          transaccionId: event.transaccionId,
        }),
      ]);
    } catch (err) {
      this.logger.error('Error al manejar evento transaction.completed', err);
    }
  }

  @OnEvent('publication.created')
  async handlePublicationCreated(event: PublicationCreatedEvent) {
    try {
      await this.notificationsService.notificarCategoriaFavorita({
        publicacionId: event.publicacionId,
        tituloPublicacion: event.tituloPublicacion,
        categoria: event.categoria,
      });
    } catch (err) {
      this.logger.error('Error al manejar evento publication.created', err);
    }
  }

  @OnEvent('reputation.rating_created')
  async handleReputationRatingCreated(event: ReputationRatingCreatedEvent) {
    try {
      await this.notificationsService.notificarCalificacionRecibida({
        destinatarioId: event.destinatarioId,
        calificadorNombre: event.calificadorNombre,
        puntuacion: event.puntuacion,
        transaccionId: event.transaccionId,
      });
    } catch (err) {
      this.logger.error(
        'Error al manejar evento reputation.rating_created',
        err,
      );
    }
  }

  @OnEvent('reputation.verification_requested')
  async handleReputationVerificationRequested(
    event: ReputationVerificationRequestedEvent,
  ) {
    try {
      await this.notificationsService.notificarSolicitudVerificacion({
        reparadorNombre: event.reparadorNombre,
        solicitudId: event.solicitudId,
      });
    } catch (err) {
      this.logger.error(
        'Error al manejar evento reputation.verification_requested',
        err,
      );
    }
  }

  @OnEvent('reputation.verification_reviewed')
  async handleReputationVerificationReviewed(
    event: ReputationVerificationReviewedEvent,
  ) {
    try {
      await this.notificationsService.notificarVerificacionRevisada({
        reparadorId: event.reparadorId,
        aprobada: event.aprobada,
        notasAdmin: event.notasAdmin,
        solicitudId: event.solicitudId,
      });
    } catch (err) {
      this.logger.error(
        'Error al manejar evento reputation.verification_reviewed',
        err,
      );
    }
  }
}
