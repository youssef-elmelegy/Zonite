import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { env } from "@/env";
import type { RefreshTokenPayload, CurrentUser } from "@zonite/shared";

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, "jwt-refresh") {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField("refreshToken"),
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
