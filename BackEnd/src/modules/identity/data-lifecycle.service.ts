import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Sesion } from './entities/sesion.entity';
import { TokenRecuperacion } from './entities/token-recuperacion.entity';
import { Usuario } from './entities/usuario.entity';

@Injectable()
export class DataLifecycleService {
  private readonly logger = new Logger(DataLifecycleService.name);

  constructor(
    @InjectRepository(Sesion)
    private readonly sesionRepo: Repository<Sesion>,
    @InjectRepository(TokenRecuperacion)
    private readonly tokenRepo: Repository<TokenRecuperacion>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
  ) {}

  /**
   * Se ejecuta todos los días a la medianoche.
   * Elimina datos que ya cumplieron su finalidad para cumplir con
   * el principio de Minimización de Datos.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async limpiarDatosExpirados() {
    this.logger.log('Iniciando limpieza de datos expirados...');

    const ahora = new Date();

    // 1. Eliminar sesiones expiradas o invalidadas
    const sesionesEliminadas = await this.sesionRepo.delete({
      fechaExpiracion: LessThan(ahora),
    });
    const sesionesInvalidas = await this.sesionRepo.delete({
      invalidado: true,
    });
    this.logger.log(`Sesiones eliminadas: ${sesionesEliminadas.affected ?? 0} expiradas, ${sesionesInvalidas.affected ?? 0} invalidadas.`);

    // 2. Eliminar tokens de recuperación expirados
    const tokensEliminados = await this.tokenRepo.delete({
      fechaExpiracion: LessThan(ahora),
    });
    this.logger.log(`Tokens de recuperación expirados eliminados: ${tokensEliminados.affected ?? 0}.`);

    // 3. Eliminar cuentas no verificadas (inactivas) que tengan más de 7 días de creadas
    const hace7Dias = new Date();
    hace7Dias.setDate(ahora.getDate() - 7);
    
    const usuariosEliminados = await this.usuarioRepo.delete({
      emailVerificado: false,
      fechaRegistro: LessThan(hace7Dias),
    });
    this.logger.log(`Usuarios no verificados eliminados: ${usuariosEliminados.affected ?? 0}.`);

    this.logger.log('Limpieza de datos expirados finalizada.');
  }
}
