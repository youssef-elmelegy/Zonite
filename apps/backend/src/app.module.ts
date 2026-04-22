import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { HealthModule } from "./modules/health/health.module";
import { DbModule } from "./db/db.module";
import { env } from "./env";
// import { AuthModule } from "./modules/auth/auth.module";

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: env.THROTTLE_GLOBAL_TTL * 1000,
        limit: env.THROTTLE_GLOBAL_LIMIT,
      },
    ]),
    DbModule,
    HealthModule,
    // AuthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
