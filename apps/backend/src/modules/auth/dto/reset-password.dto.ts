import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MOCK_DATA } from '@/constants/examples';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'New password (min 8 characters, must include uppercase, lowercase, number)',
    example: MOCK_DATA.password.newPassword,
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'password must be at least 8 characters long' })
  // @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
  //   message:
  //     'password must contain at least one uppercase letter, one lowercase letter, and one number',
  // })
  newPassword: string;
}
