import { Publication } from '../entities/publication.entity';
import { ModalidadIntercambio } from '../../../common/types';

export interface FindAllOptions {
  limit?: number;
  offset?: number;
  categoria?: string;
  modalidad?: ModalidadIntercambio;
  latitud?: number;
  longitud?: number;
  radioKm?: number;
}

export abstract class PublicationsRepository {
  abstract create(datos: Partial<Publication>): Promise<Publication>;
  abstract findById(id: string): Promise<Publication | null>;
  abstract findAll(options: FindAllOptions): Promise<Publication[]>;
  abstract update(
    id: string,
    datos: Partial<Publication>,
  ): Promise<Publication>;
  abstract save(publication: Publication): Promise<Publication>;
}
