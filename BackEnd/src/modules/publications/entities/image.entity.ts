import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Publication } from './publication.entity';

@Entity('imagenes_publicacion')
export class ImagenPublicacion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'publicacion_id' })
  publicacionId: string;

  @ManyToOne(() => Publication, (pub) => pub.imagenes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'publicacion_id' })
  publicacion: Publication;

  @Column({ length: 500 })
  url: string;

  @Column({ name: 'es_principal', default: false })
  esPrincipal: boolean;

  @Column({ type: 'smallint', default: 0 })
  orden: number;

  @CreateDateColumn({ name: 'fecha_subida', type: 'timestamptz' })
  fechaSubida: Date;
}
