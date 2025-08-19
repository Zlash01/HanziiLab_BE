import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SentencesService } from './sentences.service';
import { SentenceTranslationsService } from './sentence-translations.service';
import { SentenceTokensService } from './sentence-tokens.service';
import { SentencesController } from './sentences.controller';
import { SentenceTranslationsController } from './sentence-translations.controller';
import { SentenceTokensController } from './sentence-tokens.controller';
import { Sentence, SentenceTranslation, SentenceToken } from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sentence, SentenceTranslation, SentenceToken]),
  ],
  controllers: [
    SentencesController,
    SentenceTranslationsController,
    SentenceTokensController,
  ],
  providers: [
    SentencesService,
    SentenceTranslationsService,
    SentenceTokensService,
  ],
  exports: [
    SentencesService,
    SentenceTranslationsService,
    SentenceTokensService,
  ],
})
export class SentencesModule {}
