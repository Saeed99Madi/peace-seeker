import { Module } from '@nestjs/common';
import { VoiceModule } from '../voice/voice.module';
import { AppealsService } from './appeals.service';
import { ModerationController } from './moderation.controller';
import { ModerationService } from './moderation.service';

@Module({
  imports: [VoiceModule],
  controllers: [ModerationController],
  providers: [ModerationService, AppealsService],
})
export class ModerationModule {}
