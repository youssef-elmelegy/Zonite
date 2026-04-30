import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ErrorResponseDto } from '@/common/dto/responses.dto';
import { CheckUserResponseDto } from '../dto/check-user.dto';

export function YalgamersCheckUserDecorator() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Check if a username exists',
      description:
        "Used by the YalGamers Tournament Engine to verify that a player's username exists in the game's system before registering them for a tournament.",
    }),
    ApiHeader({
      name: 'X-Tournament-Api-Key',
      description: 'YalGamers tournament API key',
      required: true,
    }),
    ApiParam({
      name: 'userName',
      description: 'The in-game username to look up',
      example: 'ahmed_hassan',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Username existence checked successfully',
      type: CheckUserResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'API key missing or invalid',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: "Internal server error on the game's side",
      type: ErrorResponseDto,
    }),
  );
}
