import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Protege cualquier endpoint: requiere un JWT válido y con sesión activa en BD */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
