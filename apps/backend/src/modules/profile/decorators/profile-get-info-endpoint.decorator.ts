import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ErrorResponseDto } from '@/common/dto/responses.dto';
import { GetProfileInfoResponseDto } from '../dto/get-profile-info.dto';

export function ProfileGetInfoDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Get profile info',
      description:
        'Returns full profile. For drivers, includes verification_status and totalTripsCompleted. For passengers, includes base profile fields. Response is cached for 5 minutes.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Profile retrieved successfully',
      type: GetProfileInfoResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Missing or invalid access token',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'User not found',
      type: ErrorResponseDto,
    }),
  );
}
