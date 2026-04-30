import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ErrorResponseDto } from '@/common/dto/responses.dto';
import { CreateMatchDto, CreateMatchResponseDto } from '../dto/create-match.dto';

export function YalgamersCreateMatchDecorator() {
  return applyDecorators(
    HttpCode(HttpStatus.CREATED),
    ApiOperation({
      summary: 'Create a tournament match',
      description:
        'Called by the YalGamers Tournament Engine to generate a match between registered players. Creates a pending room internally and registers all players. For solo matches, each team must contain exactly one player.',
    }),
    ApiHeader({
      name: 'X-Tournament-Api-Key',
      description: 'YalGamers tournament API key',
      required: true,
    }),
    ApiBody({ type: CreateMatchDto }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Match created successfully',
      type: CreateMatchResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Bad request — missing fields or unrecognized usernames',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'API key missing or invalid',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: 'Match already exists for this tournament/round combination',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: "Internal server error on the game's side",
      type: ErrorResponseDto,
    }),
  );
}
