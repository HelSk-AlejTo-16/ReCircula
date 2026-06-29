import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicationsController } from './publications.controller';
import { PublicationsService } from './publications.service';
import { Publication } from './entities/publication.entity';
import { Componente } from './entities/component.entity';
import { ImagenPublicacion } from './entities/image.entity';
import { CategoriaArticulo } from './entities/categoria-articulo.entity';
import { PublicationsRepository } from './repositories/publications.repository';
import { TypeOrmPublicationsRepository } from './repositories/typeorm-publications.repository';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Publication,
      Componente,
      ImagenPublicacion,
      CategoriaArticulo,
    ]),
    NotificationsModule,
  ],
  controllers: [PublicationsController],
  providers: [
    PublicationsService,
    {
      provide: PublicationsRepository,
      useClass: TypeOrmPublicationsRepository,
    },
  ],
  exports: [PublicationsService, PublicationsRepository],
})
export class PublicationsModule {}
