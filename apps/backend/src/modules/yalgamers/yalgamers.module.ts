import { Module } from '@nestjs/common';
import { GatewayModule } from '@/modules/gateway/gateway.module';
import { YalgamersController } from './controllers/yalgamers.controller';
import { YalgamersService } from './services/yalgamers.service';

@Module({
  imports: [GatewayModule],
  controllers: [YalgamersController],
  providers: [YalgamersService],
  exports: [YalgamersService],
})
export class YalgamersModule {}
