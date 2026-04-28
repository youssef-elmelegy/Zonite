import { Module } from '@nestjs/common';
import { GameStateService } from './services/game-state.service';
import { ResultsService } from './services/results.service';

@Module({
  providers: [GameStateService, ResultsService],
  exports: [GameStateService],
})
export class GameModule {}
