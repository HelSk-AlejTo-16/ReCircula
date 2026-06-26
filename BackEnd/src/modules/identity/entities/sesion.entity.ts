import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Usuario } from './usuario.entity';

@Entity('sesiones')
export class Sesion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'usuario_id' })
  usuarioId: string;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  /** SHA-256 del JWT — nunca almacenamos el token en claro (seguridad) */
  @Column({ name: 'token_hash', length: 512, unique: true })
  tokenHash: string;

  @Column({ name: 'fecha_expiracion', type: 'timestamptz' })
  fechaExpiracion: Date;

  @Column({ default: false })
  invalidado: boolean;

  @Column({ name: 'ip_origen', type: 'inet', nullable: true })
  ipOrigen: string | null;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamptz' })
  fechaCreacion: Date;
}
