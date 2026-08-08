import { Module } from '@nestjs/common';
import { VoiceController } from './voice.controller';
import { VoiceService } from './voice.service';
import { VoiceCounterService } from './voice-counter.service';

@Module({
  controllers: [VoiceController],
  providers: [VoiceService, VoiceCounterService],
  exports: [VoiceCounterService],
})
export class VoiceModule {}
