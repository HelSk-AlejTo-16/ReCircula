import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationsRepository } from './repositories/notifications.repository';
import { TypeOrmNotificationsRepository } from './repositories/typeorm-notifications.repository';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  providers: [
    NotificationsService,
    {
      provide: NotificationsRepository,
      useClass: TypeOrmNotificationsRepository,
    },
  ],
  controllers: [NotificationsController],
  // Exportamos el servicio para que TransactionsModule y PublicationsModule puedan inyectarlo
  exports: [NotificationsService],
})
export class NotificationsModule {}
