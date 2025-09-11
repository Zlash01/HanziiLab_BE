import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Embedding } from './entities/embedding.entity';
import { RagContext } from './entities/rag-context.entity';
import { Word } from '../words/entities/word.entity';
import { WordSense } from '../words/entities/word-sense.entity';
import { WordSenseTranslation } from '../words/entities/word-sense-translation.entity';
import { GrammarPattern } from '../grammar/entities/grammar-pattern.entity';
import { GrammarTranslation } from '../grammar/entities/grammar-translation.entity';
import { Content } from '../lessons/entities/content.entity';
import { Question } from '../lessons/entities/question.entity';
import { EmbeddingService } from './services/embedding.service';
import { VectorSearchService } from './services/vector-search.service';
import { RagService } from './services/rag.service';
import { ContentExtractionService } from './services/content-extraction.service';
import { RagController } from './rag.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // RAG entities
      Embedding,
      RagContext,
      // Existing entities needed for content extraction
      Word,
      WordSense,
      WordSenseTranslation,
      GrammarPattern,
      GrammarTranslation,
      Content,
      Question,
    ]),
  ],
  controllers: [RagController],
  providers: [
    EmbeddingService,
    VectorSearchService,
    RagService,
    ContentExtractionService,
  ],
  exports: [
    EmbeddingService,
    VectorSearchService,
    RagService,
    ContentExtractionService,
  ],
})
export class RagModule {}