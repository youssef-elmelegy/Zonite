import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { env } from "@/env";
import type { AccessTokenPayload, CurrentUser } from "@zonite/shared";

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: env.JWT_ACCESS_SECRET,
    });
  }

  validate(payload: AccessTokenPayload): CurrentUser {
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
