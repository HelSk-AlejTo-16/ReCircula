import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HistoryService } from './history.service';
import { TransactionCompletedEvent } from '../../common/events';

@Injectable()
export class HistoryListener {
  private readonly logger = new Logger(HistoryListener.name);

  constructor(private readonly historyService: HistoryService) {}

  @OnEvent('transaction.completed')
  async handleTransactionCompleted(event: TransactionCompletedEvent) {
    try {
      await this.historyService.registerExchangeEntry(
        event.publicacionId,
        event.transaccionId,
        `Intercambio completado bajo la modalidad ${event.modalidad}.`,
        event.iniciadorId,
        event.receptorId,
      );
    } catch (err) {
      this.logger.error(
        'Error al registrar intercambio en el historial del producto',
        err,
      );
    }
  }
}
