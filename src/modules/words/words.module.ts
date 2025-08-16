import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Word } from './entities/word.entity';
import { WordSense } from './entities/word-sense.entity';
import { WordSenseTranslation } from './entities/word-sense-translation.entity';
import { WordsController } from './words.controller';
import { WordSensesController } from './word-senses.controller';
import { WordSenseTranslationsController } from './word-sense-translations.controller';
import { WordsService } from './words.service';
import { WordSensesService } from './word-senses.service';
import { WordSenseTranslationsService } from './word-sense-translations.service';

@Module({
  imports: [TypeOrmModule.forFeature([Word, WordSense, WordSenseTranslation])],
  controllers: [
    WordsController,
    WordSensesController,
    WordSenseTranslationsController,
  ],
  providers: [WordsService, WordSensesService, WordSenseTranslationsService],
  exports: [WordsService, WordSensesService, WordSenseTranslationsService],
})
export class WordsModule {}
