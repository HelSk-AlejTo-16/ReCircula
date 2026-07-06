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
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        ExtractJwt.fromUrlQueryParameter('token'),
        (req: Request) => {
          return req?.cookies?.['rc_token'] || null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret', 'secreto-dev'),
      passReqToCallback: true, // necesitamos la req para leer el token crudo
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    // Extraemos el token crudo para verificar en BD si fue invalidado (RF-01.5)
    let tokenPlano = '';
    const authHeader = req.headers['authorization'];
    if (
      authHeader &&
      !authHeader.includes('null') &&
      !authHeader.includes('undefined') &&
      authHeader.replace('Bearer ', '').trim() !== ''
    ) {
      tokenPlano = authHeader.replace('Bearer ', '');
    } else if (
      req.query?.token &&
      req.query.token !== 'null' &&
      req.query.token !== 'undefined' &&
      (req.query.token as string).trim() !== ''
    ) {
      tokenPlano = req.query.token as string;
    } else if (req.cookies?.['rc_token']) {
      tokenPlano = req.cookies['rc_token'];
    }
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
