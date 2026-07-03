import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('RF-07 — Notificaciones')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  // ── RF-07 — Obtener mis notificaciones ────────────────────────────────────────
  @Get()
  @ApiOperation({
    summary: 'RF-07 — Listar todas las notificaciones del usuario logueado',
  })
  async listar(@CurrentUser() user: { id: string }) {
    return this.svc.obtenerMisNotificaciones(user.id);
  }

  // ── RF-07 — Contar no leídas (para la campanita) ──────────────────────────────
  @Get('count')
  @ApiOperation({ summary: 'RF-07 — Número de notificaciones no leídas' })
  async contarNoLeidas(@CurrentUser() user: { id: string }) {
    return this.svc.contarNoLeidas(user.id);
  }

  // ── RF-07 — Marcar todas como leídas ─────────────────────────────────────────
  @Patch('read-all')
  @ApiOperation({
    summary: 'RF-07 — Marcar todas las notificaciones como leídas',
  })
  async marcarTodas(@CurrentUser() user: { id: string }) {
    return this.svc.marcarTodasLeidas(user.id);
  }

  // ── RF-07 — Marcar una notificación como leída ────────────────────────────────
  @Patch(':id/read')
  @ApiOperation({
    summary: 'RF-07 — Marcar una notificación específica como leída',
  })
  async marcarUna(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.svc.marcarLeida(id, user.id);
  }
}
