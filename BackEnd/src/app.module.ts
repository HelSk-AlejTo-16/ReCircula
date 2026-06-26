import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// Config factories
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import mailConfig from './config/mail.config';

// Módulos de negocio
import { IdentityModule } from './modules/identity/identity.module';

// Los siguientes módulos se implementan en futuros sprints:
// import { PublicationsModule }   from './modules/publications/publications.module';
// import { TransactionsModule }   from './modules/transactions/transactions.module';
// import { HistoryModule }        from './modules/history/history.module';
// import { MatchmakingModule }    from './modules/matchmaking/matchmaking.module';
// import { ReputationModule }     from './modules/reputation/reputation.module';
// import { NotificationsModule }  from './modules/notifications/notifications.module';

@Module({
  imports: [
    // ── Variables de entorno (.env) ──────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig, mailConfig],
    }),

    // ── TypeORM conectado a PostgreSQL (schema ya existente) ─────────────────
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => config.get('database'),
      inject: [ConfigService],
    }),

    // ── RF-01: Gestión de identidad y acceso ─────────────────────────────────
    IdentityModule,
  ],
})
export class AppModule {}
