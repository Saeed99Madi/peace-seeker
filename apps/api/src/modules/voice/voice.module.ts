import { Module } from '@nestjs/common';
import { VoiceController } from './voice.controller';
import { VoiceService } from './voice.service';
import { VoiceCounterService } from './voice-counter.service';
import { VoiceGateway } from './voice.gateway';

@Module({
  controllers: [VoiceController],
  providers: [VoiceService, VoiceCounterService, VoiceGateway],
  exports: [VoiceCounterService],
})
export class VoiceModule {}
