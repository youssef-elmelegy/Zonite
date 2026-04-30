import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ErrorResponseDto } from '@/common/dto/responses.dto';
import { StartMatchResponseDto } from '../dto/start-match.dto';

export function YalgamersStartMatchDecorator() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Start a tournament match',
      description:
        'Transitions a pending match into running state. Triggers the in-game session for all connected roster players. Rejects if any roster player is not currently connected to the lobby.',
    }),
    ApiHeader({
      name: 'X-API-Key',
      description: 'YalGamers tournament API key',
      required: true,
    }),
    ApiParam({
      name: 'matchId',
      description: 'Match ID returned from create-match',
      example: 'm_xyz789',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Match started successfully',
      type: StartMatchResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Match cannot be started (not pending, or roster players missing)',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'API key missing or invalid',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Match ID not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: "Internal server error on the game's side",
      type: ErrorResponseDto,
    }),
  );
}
