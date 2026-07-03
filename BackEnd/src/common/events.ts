export class TransactionProposedEvent {
  constructor(
    public readonly publicadorId: string,
    public readonly iniciadorNombre: string,
    public readonly publicacionId: string,
    public readonly tituloPublicacion: string,
  ) {}
}

export class TransactionAcceptedEvent {
  constructor(
    public readonly iniciadorId: string,
    public readonly transaccionId: string,
  ) {}
}

export class TransactionCanceledEvent {
  constructor(
    public readonly destinatarioId: string,
    public readonly transaccionId: string,
    public readonly notas?: string,
  ) {}
}

export class TransactionCompletedEvent {
  constructor(
    public readonly transaccionId: string,
    public readonly publicacionId: string,
    public readonly iniciadorId: string,
    public readonly receptorId: string,
    public readonly modalidad: string,
  ) {}
}

export class PublicationCreatedEvent {
  constructor(
    public readonly publicacionId: string,
    public readonly tituloPublicacion: string,
    public readonly categoria: string,
  ) {}
}

export class ReputationRatingCreatedEvent {
  constructor(
    public readonly destinatarioId: string,
    public readonly calificadorNombre: string,
    public readonly puntuacion: number,
    public readonly transaccionId: string,
  ) {}
}

export class ReputationVerificationRequestedEvent {
  constructor(
    public readonly reparadorNombre: string,
    public readonly solicitudId: string,
  ) {}
}

export class ReputationVerificationReviewedEvent {
  constructor(
    public readonly reparadorId: string,
    public readonly aprobada: boolean,
    public readonly notasAdmin: string | undefined,
    public readonly solicitudId: string,
  ) {}
}
