import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ErrorResponseDto } from '@/common/dto/responses.dto';
import { GetProfileInfoResponseDto } from '../dto/get-profile-info.dto';
import { UpdateProfileInfoDto } from '../dto';

export function ProfileUpdateInfoDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Update profile info',
      description:
        'Update editable profile fields. email and role cannot be changed via this endpoint. All fields are optional.',
    }),
    ApiBody({
      description: 'Profile information to update',
      type: UpdateProfileInfoDto,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Profile updated successfully',
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
    ApiResponse({
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      description: 'Validation error',
      type: ErrorResponseDto,
    }),
  );
}
