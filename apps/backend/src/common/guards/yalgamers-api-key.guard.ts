import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { env } from '@/env';
import { errorResponse } from '@/utils';

const HEADER_NAME = 'x-tournament-api-key';

@Injectable()
export class YalgamersApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const provided = request.headers[HEADER_NAME];
    const apiKey = Array.isArray(provided) ? provided[0] : provided;

    if (!apiKey || apiKey !== env.YALGAMERS_API_KEY) {
      throw new UnauthorizedException(
        errorResponse(
          'API key missing or invalid',
          HttpStatus.UNAUTHORIZED,
          'UnauthorizedException',
        ),
      );
    }

    return true;
  }
}
