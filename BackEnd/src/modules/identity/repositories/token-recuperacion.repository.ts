import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenRecuperacion } from '../entities/token-recuperacion.entity';

@Injectable()
export class TokenRecuperacionRepository {
  constructor(
    @InjectRepository(TokenRecuperacion)
    private readonly repo: Repository<TokenRecuperacion>,
  ) {}

  async crear(datos: Partial<TokenRecuperacion>): Promise<TokenRecuperacion> {
    return this.repo.save(this.repo.create(datos));
  }

  async findValidoPorHash(
    tokenHash: string,
  ): Promise<TokenRecuperacion | null> {
    return this.repo.findOne({
      where: { tokenHash, usado: false },
      relations: { usuario: true },
    });
  }

  async marcarUsado(id: string): Promise<void> {
    await this.repo.update(id, { usado: true });
  }

  /** Invalida todos los tokens previos del usuario antes de generar uno nuevo */
  async invalidarPreviosDeUsuario(usuarioId: string): Promise<void> {
    await this.repo.update({ usuarioId, usado: false }, { usado: true });
  }
}
