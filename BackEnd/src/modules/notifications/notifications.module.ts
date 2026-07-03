import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationsRepository } from './repositories/notifications.repository';
import { TypeOrmNotificationsRepository } from './repositories/typeorm-notifications.repository';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsListener } from './notifications.listener';

@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  providers: [
    NotificationsService,
    NotificationsListener,
    {
      provide: NotificationsRepository,
      useClass: TypeOrmNotificationsRepository,
    },
  ],
  controllers: [NotificationsController],
  // Exportamos el servicio si es necesario para otros módulos
  exports: [NotificationsService],
})
export class NotificationsModule {}
