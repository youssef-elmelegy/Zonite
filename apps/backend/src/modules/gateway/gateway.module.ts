import { Module } from '@nestjs/common';
import { GameModule } from '@/modules/game/game.module';
import { RoomsModule } from '@/modules/rooms/rooms.module';
import { ProfileModule } from '@/modules/profile/profile.module';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { WsExceptionsFilter } from './filters/ws-exceptions.filter';
import { GameGateway } from './game.gateway';

@Module({
  imports: [GameModule, RoomsModule, ProfileModule],
  providers: [GameGateway, WsJwtGuard, WsExceptionsFilter],
  exports: [GameGateway],
})
export class GatewayModule {}
