import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-jwt";
import { Request } from "express";
import { env } from "@/env";
import { REFRESH_TOKEN_COOKIE } from "@/constants";
import type { RefreshTokenPayload, CurrentUser } from "@zonite/shared";

@Injectable()
export class RefreshTokenCookieStrategy extends PassportStrategy(Strategy, "jwt-refresh-cookie") {
  constructor() {
    super({
      jwtFromRequest: (req: Request) => {
        if (req && req.cookies) {
          return req.cookies[REFRESH_TOKEN_COOKIE];
        }
        return null;
      },
      ignoreExpiration: false,
      secretOrKey: env.JWT_REFRESH_SECRET,
    });
  }

  validate(payload: RefreshTokenPayload): CurrentUser & { jti: string } {
    return {
      id: payload.sub,
      email: "", // Will be populated by the auth service
      role: "user", // Will be populated by the auth service
      jti: payload.jti,
    };
  }
}
