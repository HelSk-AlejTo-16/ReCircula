import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Publication } from './publication.entity';

@Entity('componentes')
export class Componente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'publicacion_id' })
  publicacionId: string;

  @ManyToOne(() => Publication, (pub) => pub.componentes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'publicacion_id' })
  publicacion: Publication;

  @Column({ length: 150 })
  nombre: string;

  @Column({ default: false })
  funcional: boolean;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({
    name: 'precio_pieza',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  precioPieza: number | null;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamptz' })
  fechaCreacion: Date;
}
