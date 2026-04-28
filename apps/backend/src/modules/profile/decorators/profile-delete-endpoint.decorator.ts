import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ErrorResponseDto } from '@/common/dto/responses.dto';
import { DeleteProfileResponseWrapperDto } from '../dto/delete-profile.dto';

export function ProfileDeleteDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Delete account',
      description:
        "Permanently deletes the authenticated user's own account. This is a hard delete — all associated data (profile, driver record) is removed via cascade.",
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Account deleted successfully',
      type: DeleteProfileResponseWrapperDto,
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
