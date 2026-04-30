import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { YalgamersApiKeyGuard } from '@/common/guards';
import { YalgamersService } from '../services/yalgamers.service';
import {
  YalgamersCheckUserDecorator,
  YalgamersCreateMatchDecorator,
  YalgamersMatchResultsDecorator,
  YalgamersStartMatchDecorator,
} from '../decorators';
import { CreateMatchDto } from '../dto';

@ApiTags('YalGamers Integration')
@Controller('')
@UseGuards(YalgamersApiKeyGuard)
export class YalgamersController {
  constructor(private readonly yalgamersService: YalgamersService) {}

  @Get('check-user/:userName')
  @YalgamersCheckUserDecorator()
  checkUser(@Param('userName') userName: string) {
    return this.yalgamersService.checkUserExists(userName);
  }

  @Post('create-match')
  @YalgamersCreateMatchDecorator()
  createMatch(@Body() dto: CreateMatchDto) {
    return this.yalgamersService.createMatch(dto);
  }

  @Post('start-match/:matchId')
  @YalgamersStartMatchDecorator()
  startMatch(@Param('matchId') matchId: string) {
    return this.yalgamersService.startMatch(matchId);
  }

  @Get('match-results/:matchId')
  @YalgamersMatchResultsDecorator()
  getMatchResults(@Param('matchId') matchId: string) {
    return this.yalgamersService.getMatchResults(matchId);
  }
}
