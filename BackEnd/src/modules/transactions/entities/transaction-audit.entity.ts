import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Transaction } from './transaction.entity';
import { Usuario } from '../../identity/entities/usuario.entity';
import { EstadoTransaccion } from '../../../common/types';

@Entity('auditoria_transacciones')
export class TransactionAudit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'transaccion_id' })
  transaccionId: string;

  @ManyToOne(() => Transaction, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'transaccion_id' })
  transaccion: Transaction;

  @Column({
    name: 'estado_anterior',
    type: 'enum',
    enum: EstadoTransaccion,
    enumName: 'estado_transaccion',
    nullable: true,
  })
  estadoAnterior: EstadoTransaccion | null;

  @Column({
    name: 'estado_nuevo',
    type: 'enum',
    enum: EstadoTransaccion,
    enumName: 'estado_transaccion',
  })
  estadoNuevo: EstadoTransaccion;

  @Column({ name: 'usuario_responsable_id' })
  usuarioResponsableId: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_responsable_id' })
  usuarioResponsable: Usuario;

  @Column({ type: 'text', nullable: true })
  notas: string | null;

  @CreateDateColumn({ name: 'fecha_cambio', type: 'timestamptz' })
  fechaCambio: Date;
}
