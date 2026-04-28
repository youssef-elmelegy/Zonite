import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { HealthModule } from './modules/health/health.module';
import { DbModule } from './db/db.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { GameModule } from './modules/game/game.module';
import { GatewayModule } from './modules/gateway/gateway.module';
import { ProfileModule } from './modules/profile/profile.module';
import { env } from './env';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: env.THROTTLE_GLOBAL_TTL * 1000,
        limit: env.THROTTLE_GLOBAL_LIMIT,
      },
    ]),
    DbModule,
    AuthModule,
    HealthModule,
    RoomsModule,
    GameModule,
    GatewayModule,
    ProfileModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
