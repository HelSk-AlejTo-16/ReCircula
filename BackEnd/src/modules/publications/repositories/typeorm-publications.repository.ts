import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Publication } from '../entities/publication.entity';
import {
  PublicationsRepository,
  FindAllOptions,
} from './publications.repository';
import { EstadoPublicacion } from '../../../common/types';

@Injectable()
export class TypeOrmPublicationsRepository implements PublicationsRepository {
  constructor(
    @InjectRepository(Publication)
    private readonly repo: Repository<Publication>,
  ) {}

  async create(datos: Partial<Publication>): Promise<Publication> {
    const pub = this.repo.create(datos);
    return this.repo.save(pub);
  }

  async findById(id: string): Promise<Publication | null> {
    return this.repo.findOne({
      where: { id },
      relations: { componentes: true, imagenes: true, publicador: true },
    });
  }

  async findAll(options: FindAllOptions): Promise<Publication[]> {
    // Si se proporciona latitud y longitud, usamos la función de la BD fn_buscar_publicaciones (PostGIS GIST index)
    if (options.latitud !== undefined && options.longitud !== undefined) {
      const radio = options.radioKm ?? 10;
      const query = `SELECT * FROM fn_buscar_publicaciones($1, $2, $3, $4, $5)`;
      const params = [
        options.latitud,
        options.longitud,
        radio,
        options.categoria || null,
        options.modalidad || null,
      ];

      const raw = await this.repo.query(query, params);

      // Mapeamos los resultados planos de la función SQL para que coincidan con la estructura esperada por el cliente.
      // Retornamos publicaciones mapeando los valores.
      return raw.map((item: any) => {
        const pub = new Publication();
        pub.id = item.id;
        pub.titulo = item.titulo;
        pub.categoria = item.categoria;
        pub.modalidad = item.modalidad;
        pub.precio = item.precio ? parseFloat(item.precio) : null;
        pub.ubicacion = {
          latitud: item.latitud,
          longitud: item.longitud,
        };
        // Para listado, agregamos la imagen principal como un array de 1 elemento
        pub.imagenes = item.imagen_principal
          ? [
              {
                url: item.imagen_principal,
                esPrincipal: true,
                orden: 0,
              } as any,
            ]
          : [];
        pub.fechaCreacion = new Date(); // Valor por defecto para listados ordenados por distancia
        // Agregamos un campo temporal no mapeado para la distancia
        (pub as any).distanciaKm = parseFloat(item.distancia_km);
        (pub as any).publicadorNombre = item.publicador_nombre;
        return pub;
      });
    }

    // De lo contrario, hacemos una búsqueda TypeORM tradicional
    const where: any = {
      estado: In([EstadoPublicacion.PUBLICADO, EstadoPublicacion.RESERVADO]),
    };

    if (options.categoria) {
      where.categoria = options.categoria;
    }

    if (options.modalidad) {
      where.modalidad = options.modalidad;
    }

    return this.repo.find({
      where,
      relations: { imagenes: true, componentes: true, publicador: true },
      order: { fechaCreacion: 'DESC' },
      take: options.limit ?? 20,
      skip: options.offset ?? 0,
    });
  }

  async update(id: string, datos: Partial<Publication>): Promise<Publication> {
    await this.repo.update(id, datos);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(
        `Publicación con ID ${id} no encontrada después de actualizar`,
      );
    }
    return updated;
  }

  async save(publication: Publication): Promise<Publication> {
    return this.repo.save(publication);
  }
}
