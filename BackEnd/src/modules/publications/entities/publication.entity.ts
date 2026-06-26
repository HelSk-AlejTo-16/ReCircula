import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  ValueTransformer,
} from 'typeorm';
import { Usuario } from '../../identity/entities/usuario.entity';
import { Componente } from './component.entity';
import { ImagenPublicacion } from './image.entity';
import { EstadoPublicacion, ModalidadIntercambio } from '../../../common/types';

export const pointTransformer: ValueTransformer = {
  from(value: any) {
    if (!value) return null;
    if (typeof value === 'object' && value.type === 'Point') {
      return {
        longitud: value.coordinates[0],
        latitud: value.coordinates[1],
      };
    }
    if (typeof value === 'string' && value.startsWith('POINT')) {
      const match = value.match(/POINT\(([^ ]+) ([^ ]+)\)/);
      if (match) {
        return {
          longitud: parseFloat(match[1]),
          latitud: parseFloat(match[2]),
        };
      }
    }
    return value;
  },
  to(value: any) {
    if (!value) return null;
    if (
      typeof value === 'object' &&
      value.latitud !== undefined &&
      value.longitud !== undefined
    ) {
      return {
        type: 'Point',
        coordinates: [value.longitud, value.latitud],
      };
    }
    return value;
  },
};

@Entity('publicaciones')
export class Publication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  titulo: string;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ length: 100 })
  categoria: string;

  @Column({
    type: 'enum',
    enum: ModalidadIntercambio,
    enumName: 'modalidad_intercambio',
  })
  modalidad: ModalidadIntercambio;

  @Column({
    type: 'enum',
    enum: EstadoPublicacion,
    enumName: 'estado_publicacion',
    default: EstadoPublicacion.BORRADOR,
  })
  estado: EstadoPublicacion;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  precio: number | null;

  @Column({ length: 3, default: 'MXN' })
  moneda: string;

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    transformer: pointTransformer,
  })
  ubicacion: { latitud: number; longitud: number };

  @Column({ name: 'direccion_referencia', type: 'text', nullable: true })
  direccionReferencia: string | null;

  @Column({ name: 'publicador_id' })
  publicadorId: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'publicador_id' })
  publicador: Usuario;

  @OneToMany(() => Componente, (comp) => comp.publicacion, { cascade: true })
  componentes: Componente[];

  @OneToMany(() => ImagenPublicacion, (img) => img.publicacion, {
    cascade: true,
  })
  imagenes: ImagenPublicacion[];

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamptz' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion', type: 'timestamptz' })
  fechaActualizacion: Date;

  @Column({ name: 'fecha_archivado', type: 'timestamptz', nullable: true })
  fechaArchivado: Date | null;
}
