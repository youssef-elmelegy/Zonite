import { ArgumentsHost, Catch, Logger } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import type { Socket } from 'socket.io';
import { GameEvents } from '@zonite/shared';

@Catch()
export class WsExceptionsFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(WsExceptionsFilter.name);

  override catch(exception: unknown, host: ArgumentsHost): void {
    const client = host.switchToWs().getClient<Socket>();

    let message = 'Internal server error';
    let code: string | undefined;

    if (exception instanceof WsException) {
      const err = exception.getError();
      if (typeof err === 'string') {
        message = err;
      } else if (err && typeof err === 'object') {
        const obj = err as { message?: string; code?: string };
        if (obj.message) message = obj.message;
        if (obj.code) code = obj.code;
      }
    } else if (exception instanceof Error) {
      this.logger.error(exception.stack);
    }

    client.emit(GameEvents.EXCEPTION, code ? { message, code } : { message });
  }
}
