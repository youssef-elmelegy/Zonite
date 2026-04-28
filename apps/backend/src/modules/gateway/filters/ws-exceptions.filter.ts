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

    if (exception instanceof WsException) {
      const err = exception.getError();
      message = typeof err === 'string' ? err : ((err as { message?: string }).message ?? message);
    } else if (exception instanceof Error) {
      this.logger.error(exception.stack);
    }

    client.emit(GameEvents.EXCEPTION, { message });
  }
}
