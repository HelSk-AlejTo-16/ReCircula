import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Verificar el estado de salud de la aplicación y base de datos',
  })
  @ApiResponse({ status: 200, description: 'Servicio arriba y saludable' })
  @ApiResponse({
    status: 503,
    description: 'Servicio no disponible debido a fallos en dependencias',
  })
  async check() {
    try {
      // Validar conexión con la base de datos (PostgreSQL/PostGIS)
      await this.entityManager.query('SELECT 1');
      return {
        status: 'up',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      throw new ServiceUnavailableException({
        status: 'down',
        database: 'disconnected',
        error: error.message || 'Error desconocido de conexión',
        timestamp: new Date().toISOString(),
      });
    }
  }
}
