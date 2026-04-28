import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import type { Socket } from 'socket.io';
import type { AccessTokenPayload, CurrentUser } from '@zonite/shared';
import { GameEvents } from '@zonite/shared';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const client: Socket = context.switchToWs().getClient();

    // Cached on first successful auth — subsequent guarded events skip cookie parsing.
    if (client.data.user) return true;

    const token = this.extractToken(client);
    if (!token) {
      client.emit(GameEvents.EXCEPTION, { message: 'Unauthorized: no token provided' });
      throw new WsException('Unauthorized: no token provided');
    }

    try {
      const payload = this.jwtService.verify<AccessTokenPayload>(token);
      client.data.user = {
        id: payload.sub,
        email: payload.email,
        fullName: payload.fullName ?? '',
      } satisfies CurrentUser;
      return true;
    } catch {
      client.emit(GameEvents.EXCEPTION, { message: 'Unauthorized: invalid or expired token' });
      throw new WsException('Unauthorized: invalid or expired token');
    }
  }

  private extractToken(client: Socket): string | undefined {
    const authToken = client.handshake.auth?.token as string | undefined;
    if (authToken) return authToken;

    const cookieHeader = client.handshake.headers.cookie;
    if (!cookieHeader) return undefined;

    for (const part of cookieHeader.split(';')) {
      const [rawName, ...rest] = part.split('=');
      if (rawName?.trim() === 'accessToken') {
        return decodeURIComponent(rest.join('=').trim());
      }
    }
    return undefined;
  }
}
