import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
  host: process.env.MAIL_HOST ?? 'sandbox.smtp.mailtrap.io',
  port: parseInt(process.env.MAIL_PORT ?? '2525', 10),

  // 👇 Pon tus credenciales REALES aquí entre comillas, borrando el process.env
  user: 'pega_tu_usuario_real_aqui',
  pass: 'pega_tu_contraseña_real_aqui',

  from: process.env.MAIL_FROM ?? 'ReCircula <noreply@recircula.mx>',
  appUrl: process.env.APP_URL ?? 'http://localhost:3000',
  verifyExpiresMin: parseInt(
    process.env.EMAIL_VERIFY_EXPIRES_MIN ?? '1440',
    10,
  ),
  recoveryExpiresMin: parseInt(
    process.env.RECOVERY_TOKEN_EXPIRES_MIN ?? '60',
    10,
  ),
}));
