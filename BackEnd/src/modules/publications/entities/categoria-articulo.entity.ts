import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('categorias_articulo')
export class CategoriaArticulo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, unique: true })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ length: 50, nullable: true })
  icono: string;

  @Column({ default: true })
  activa: boolean;
}
