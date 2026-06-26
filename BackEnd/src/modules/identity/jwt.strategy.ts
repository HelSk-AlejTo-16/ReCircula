import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import * as crypto from 'crypto';
import { IdentityService } from './identity.service';

export interface JwtPayload {
  sub: string;
  email: string;
  rol: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly identityService: IdentityService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret', 'secreto-dev'),
      passReqToCallback: true, // necesitamos la req para leer el token crudo
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    // Extraemos el token crudo para verificar en BD si fue invalidado (RF-01.5)
    const tokenPlano = (req.headers['authorization'] ?? '').replace(
      'Bearer ',
      '',
    );
    const tokenHash = crypto
      .createHash('sha256')
      .update(tokenPlano)
      .digest('hex');

    const valida = await this.identityService.esSesionValida(tokenHash);
    if (!valida) {
      throw new UnauthorizedException(
        'Sesión inválida o expirada. Inicia sesión de nuevo.',
      );
    }

    // El objeto retornado queda disponible como req.user en todos los controladores
    return { id: payload.sub, email: payload.email, rol: payload.rol };
  }
}
