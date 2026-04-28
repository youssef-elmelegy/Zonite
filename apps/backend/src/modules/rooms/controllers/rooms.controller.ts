import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards';
import { CurrentUser, Public } from '@/common/decorators';
import { PaginationQueryDto } from '@/common/dto';
import type { CurrentUser as CurrentUserType } from '@zonite/shared';
import type { PaginatedResponse, SuccessResponse } from '@/types';
import { RoomsService } from '../services/rooms.service';
import { CreateRoomDto } from '../dto/create-room.dto';
import { UpdateRoomDto } from '../dto/update-room.dto';
import { RoomResponseDto } from '../dto/room-response.dto';

@ApiTags('rooms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new room (authenticated)' })
  create(
    @Body() dto: CreateRoomDto,
    @CurrentUser() user: CurrentUserType,
  ): Promise<SuccessResponse<RoomResponseDto>> {
    return this.roomsService.create(user.id, dto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'List rooms in LOBBY status' })
  list(@Query() query: PaginationQueryDto): Promise<PaginatedResponse<RoomResponseDto>> {
    return this.roomsService.list(query);
  }

  @Get(':code')
  @Public()
  @ApiOperation({ summary: 'Get room details by 6-character code' })
  findOne(@Param('code') code: string): Promise<SuccessResponse<RoomResponseDto>> {
    return this.roomsService.findByCode(code);
  }

  @Patch(':code')
  @ApiOperation({ summary: 'Update room config (host only, LOBBY status)' })
  update(
    @Param('code') code: string,
    @Body() dto: UpdateRoomDto,
    @CurrentUser() user: CurrentUserType,
  ): Promise<SuccessResponse<RoomResponseDto>> {
    return this.roomsService.update(code, user.id, dto);
  }

  @Delete(':code')
  @ApiOperation({ summary: 'Close room (host only)' })
  remove(
    @Param('code') code: string,
    @CurrentUser() user: CurrentUserType,
  ): Promise<SuccessResponse<null>> {
    return this.roomsService.remove(code, user.id);
  }
}
