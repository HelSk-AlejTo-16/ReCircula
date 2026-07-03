import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsListener } from './notifications.listener';
import { NotificationsService } from './notifications.service';
import { TransactionProposedEvent } from '../../common/events';

describe('NotificationsListener', () => {
  let listener: NotificationsListener;
  let notificationsServiceMock: Partial<NotificationsService>;

  beforeEach(async () => {
    notificationsServiceMock = {
      notificarInteresEnPublicacion: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsListener,
        {
          provide: NotificationsService,
          useValue: notificationsServiceMock,
        },
      ],
    }).compile();

    listener = module.get<NotificationsListener>(NotificationsListener);
  });

  it('debe estar definido', () => {
    expect(listener).toBeDefined();
  });

  it('debe invocar a NotificationsService al recibir el evento transaction.proposed', async () => {
    const event = new TransactionProposedEvent(
      'publicador-123',
      'Iniciador Nombre',
      'publicacion-456',
      'Artículo Electrónico',
    );

    await listener.handleTransactionProposed(event);

    expect(
      notificationsServiceMock.notificarInteresEnPublicacion,
    ).toHaveBeenCalledWith({
      publicadorId: 'publicador-123',
      iniciadorNombre: 'Iniciador Nombre',
      publicacionId: 'publicacion-456',
      tituloPublicacion: 'Artículo Electrónico',
    });
  });

  it('debe capturar errores de forma resiliente y no lanzar excepciones cuando el servicio falla', async () => {
    const event = new TransactionProposedEvent(
      'publicador-123',
      'Iniciador Nombre',
      'publicacion-456',
      'Artículo Electrónico',
    );

    // Hacer que el servicio de notificaciones falle arrojando una excepción
    (
      notificationsServiceMock.notificarInteresEnPublicacion as jest.Mock
    ).mockRejectedValue(
      new Error('Falló el envío de correo de la notificación'),
    );

    // Al llamar al listener, NO debe arrojar excepción (resiliencia ante fallos parciales)
    await expect(
      listener.handleTransactionProposed(event),
    ).resolves.not.toThrow();

    expect(
      notificationsServiceMock.notificarInteresEnPublicacion,
    ).toHaveBeenCalled();
  });
});
