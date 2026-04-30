import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ErrorResponseDto } from '@/common/dto/responses.dto';
import { MatchResultsResponseDto } from '../dto/match-results.dto';

export function YalgamersMatchResultsDecorator() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Get tournament match results',
      description:
        'Returns the current state of a match. While pending or running, winner is null. When completed, winner is the team object whose teamId matches the create-match request.',
    }),
    ApiHeader({
      name: 'X-Tournament-Api-Key',
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
      description: 'Match results fetched',
      type: MatchResultsResponseDto,
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
