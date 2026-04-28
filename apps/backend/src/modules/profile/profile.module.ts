import { Module } from '@nestjs/common';
import { ProfileController } from './controllers/profile.controller';
import { ProfileService } from './services/profile.service';
import { EmailService } from '@/common/services';

@Module({
  controllers: [ProfileController],
  providers: [ProfileService, EmailService],
  exports: [ProfileService],
})
export class ProfileModule {}
