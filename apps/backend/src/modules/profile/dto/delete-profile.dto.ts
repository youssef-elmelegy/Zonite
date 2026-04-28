import { ApiProperty } from '@nestjs/swagger';
import { MOCK_DATA } from '@/constants';

export class DeleteProfileResponseDto {
  @ApiProperty({ example: 'Account deleted successfully' })
  message: string;
}

export class DeleteProfileResponseWrapperDto {
  @ApiProperty({ example: 200 })
  code: number;

  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Account deleted successfully' })
  message: string;

  @ApiProperty({ type: DeleteProfileResponseDto })
  data: DeleteProfileResponseDto;

  @ApiProperty({ example: MOCK_DATA.dates.default })
  timestamp: string;
}
