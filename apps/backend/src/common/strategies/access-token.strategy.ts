import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { env } from '@/env';
import type { AccessTokenPayload, CurrentUser } from '@zonite/shared';
import type { Request } from 'express';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: (req: Request) => {
        // First try cookies (accessToken or tempToken)
        if (req.cookies?.accessToken) {
          return req.cookies.accessToken;
        }
        if (req.cookies?.tempToken) {
          return req.cookies.tempToken;
        }

        // Fall back to Authorization Bearer header
        return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
      },
      ignoreExpiration: false,
      secretOrKey: env.JWT_ACCESS_SECRET,
    });
  }

  validate(payload: AccessTokenPayload): CurrentUser {
    return {
      id: payload.sub,
      email: payload.email,
      fullName: payload.fullName ?? '',
    };
  }
}
