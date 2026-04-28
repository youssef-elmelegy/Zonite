import { Module } from '@nestjs/common';
import { RoomsController } from './controllers/rooms.controller';
import { RoomsService } from './services/rooms.service';

@Module({
  controllers: [RoomsController],
  providers: [RoomsService],
  exports: [RoomsService],
})
export class RoomsModule {}
