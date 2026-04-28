import { Body, Controller, Delete, Get, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards';
import { CurrentUser } from '@/common/decorators';
import { ProfileService } from '../services/profile.service';
import {
  ProfileDeleteDecorator,
  ProfileGetInfoDecorator,
  ProfileUpdateEmailDecorator,
  ProfileUpdateInfoDecorator,
} from '../decorators';
import { UpdateProfileEmailDto, UpdateProfileInfoDto } from '../dto';
import { PaginationQueryDto } from '@/common';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('info')
  @ProfileGetInfoDecorator()
  getProfileInfo(@CurrentUser('id') userId: string) {
    return this.profileService.getProfileInfo(userId);
  }

  @Put('info')
  @ProfileUpdateInfoDecorator()
  updateProfileInfo(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileInfoDto) {
    return this.profileService.updateProfileInfo(userId, dto);
  }

  @Put('email')
  @ProfileUpdateEmailDecorator()
  updateEmail(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileEmailDto) {
    return this.profileService.updateEmail(userId, dto);
  }

  @Delete()
  @ProfileDeleteDecorator()
  deleteAccount(@CurrentUser('id') userId: string) {
    return this.profileService.deleteAccount(userId);
  }

  // @Get()
  // async getProfile(@CurrentUser('id') userId: string) {
  //   return this.profileService.getProfile(userId);
  // }

  @Get('matches')
  async getmatchPlayerRecords(
    @CurrentUser('id') userId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.profileService.getmatchPlayerRecords(userId, query);
  }
}
