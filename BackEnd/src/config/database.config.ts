import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs('database', (): TypeOrmModuleOptions => {
  const isCloud =
    process.env.DB_SSL === 'true' || !!process.env.EXTERNAL_DATABASE_URL;
  const sslConfig = isCloud ? { rejectUnauthorized: false } : false;

  if (process.env.EXTERNAL_DATABASE_URL) {
    return {
      type: 'postgres',
      url: process.env.EXTERNAL_DATABASE_URL,
      autoLoadEntities: true,
      synchronize: false,
      logging: process.env.NODE_ENV === 'development',
      ssl: sslConfig,
    };
  }

  return {
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USER ?? process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'linux123',
    database: process.env.DB_NAME ?? process.env.DB_DATABASE ?? 'ReCircula',
    autoLoadEntities: true,
    synchronize: false,
    logging: process.env.NODE_ENV === 'development',
    ssl: sslConfig,
  };
});
