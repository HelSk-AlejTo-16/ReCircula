import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sesion } from '../entities/sesion.entity';

@Injectable()
export class SesionRepository {
  constructor(
    @InjectRepository(Sesion)
    private readonly repo: Repository<Sesion>,
  ) {}

  async crear(datos: Partial<Sesion>): Promise<Sesion> {
    return this.repo.save(this.repo.create(datos));
  }

  async findByTokenHash(tokenHash: string): Promise<Sesion | null> {
    return this.repo.findOne({ where: { tokenHash } });
  }

  async invalidar(id: string): Promise<void> {
    await this.repo.update(id, { invalidado: true });
  }

  /** Invalida todas las sesiones activas de un usuario (ej: al resetear password) */
  async invalidarTodasDeUsuario(usuarioId: string): Promise<void> {
    await this.repo.update(
      { usuarioId, invalidado: false },
      { invalidado: true },
    );
  }

  async esSesionValida(tokenHash: string): Promise<boolean> {
    const sesion = await this.repo.findOne({ where: { tokenHash } });
    if (!sesion) return false;
    if (sesion.invalidado) return false;
    if (new Date() > sesion.fechaExpiracion) return false;
    return true;
  }
}
