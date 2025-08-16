import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GrammarPatternsService } from './grammar-patterns.service';
import { GrammarTranslationsService } from './grammar-translations.service';
import { GrammarPatternsController } from './grammar-patterns.controller';
import { GrammarTranslationsController } from './grammar-translations.controller';
import { GrammarPattern } from './entities/grammar-pattern.entity';
import { GrammarTranslation } from './entities/grammar-translation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GrammarPattern, GrammarTranslation])],
  controllers: [GrammarPatternsController, GrammarTranslationsController],
  providers: [GrammarPatternsService, GrammarTranslationsService],
  exports: [GrammarPatternsService, GrammarTranslationsService],
})
export class GrammarModule {}
