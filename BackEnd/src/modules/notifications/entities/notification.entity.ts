import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Usuario } from '../../identity/entities/usuario.entity';
import { TipoNotificacion } from '../../../common/types';

@Entity('notificaciones')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'destinatario_id', type: 'uuid' })
  destinatarioId: string;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'destinatario_id' })
  destinatario: Usuario;

  @Column({
    type: 'enum',
    enum: TipoNotificacion,
    enumName: 'tipo_notificacion',
  })
  tipo: TipoNotificacion;

  @Column({ type: 'varchar', length: 200 })
  titulo: string;

  @Column({ type: 'text' })
  mensaje: string;

  @Column({ type: 'boolean', default: false })
  leida: boolean;

  /** UUID del objeto relacionado (publicación, transacción, etc.) */
  @Column({ name: 'referencia_id', type: 'uuid', nullable: true })
  referenciaId: string | null;

  /** Tipo del objeto relacionado: 'publicacion' | 'transaccion' | 'calificacion' */
  @Column({
    name: 'referencia_tipo',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  referenciaTipo: string | null;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamptz' })
  fechaCreacion: Date;

  @Column({ name: 'fecha_lectura', type: 'timestamptz', nullable: true })
  fechaLectura: Date | null;
}
