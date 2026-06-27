import { Transaction } from '../entities/transaction.entity';
import { TransactionAudit } from '../entities/transaction-audit.entity';

export abstract class TransactionsRepository {
  abstract create(datos: Partial<Transaction>): Promise<Transaction>;
  abstract save(tx: Transaction): Promise<Transaction>;
  abstract findById(id: string): Promise<Transaction | null>;
  abstract findAllForUser(userId: string): Promise<Transaction[]>;
  abstract saveAuditLog(
    audit: Partial<TransactionAudit>,
  ): Promise<TransactionAudit>;
}
