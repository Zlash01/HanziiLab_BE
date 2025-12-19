import { Module } from '@nestjs/common';
import { AudioGenController } from './audio-gen.controller';
import { AudioGenService } from './audio-gen.service';

@Module({
  controllers: [AudioGenController],
  providers: [AudioGenService],
  exports: [AudioGenService],
})
export class AudioGenModule {}
