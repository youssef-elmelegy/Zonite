import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { env } from '@/env';
import type { RefreshTokenPayload, CurrentUser } from '@zonite/shared';
import type { Request } from 'express';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    super({
      jwtFromRequest: (req: Request) => {
        // First try refreshToken cookie
        if (req.cookies?.refreshToken) {
          return req.cookies.refreshToken;
        }

        // Fall back to request body field
        return ExtractJwt.fromBodyField('refreshToken')(req);
      },
      ignoreExpiration: false,
      secretOrKey: env.JWT_REFRESH_SECRET,
    });
  }

  validate(payload: RefreshTokenPayload): CurrentUser & { jti: string } {
    return {
      id: payload.sub,
      email: '',
      fullName: '',
      jti: payload.jti,
    };
  }
}
