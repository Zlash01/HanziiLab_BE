import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Word } from '../../words/entities/word.entity';
import { WordSense } from '../../words/entities/word-sense.entity';
import { WordSenseTranslation } from '../../words/entities/word-sense-translation.entity';
import { GrammarPattern } from '../../grammar/entities/grammar-pattern.entity';
import { GrammarTranslation } from '../../grammar/entities/grammar-translation.entity';
import { Content } from '../../lessons/entities/content.entity';
import { Question } from '../../lessons/entities/question.entity';
import { Embedding, SourceType } from '../entities/embedding.entity';
import { EmbeddingService } from './embedding.service';

export interface ExtractedContent {
  sourceType: SourceType;
  sourceId: number;
  text: string;
  metadata: Record<string, any>;
}

@Injectable()
export class ContentExtractionService {
  private readonly logger = new Logger(ContentExtractionService.name);

  constructor(
    @InjectRepository(Word)
    private wordRepository: Repository<Word>,
    @InjectRepository(WordSense)
    private wordSenseRepository: Repository<WordSense>,
    @InjectRepository(WordSenseTranslation)
    private wordSenseTranslationRepository: Repository<WordSenseTranslation>,
    @InjectRepository(GrammarPattern)
    private grammarPatternRepository: Repository<GrammarPattern>,
    @InjectRepository(GrammarTranslation)
    private grammarTranslationRepository: Repository<GrammarTranslation>,
    @InjectRepository(Content)
    private contentRepository: Repository<Content>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(Embedding)
    private embeddingRepository: Repository<Embedding>,
    private embeddingService: EmbeddingService,
  ) {}

  async extractWordContent(): Promise<ExtractedContent[]> {
    this.logger.log('Extracting word content for embedding...');
    
    const words = await this.wordRepository.find({
      relations: ['senses', 'senses.translations'],
    });

    const extractedContent: ExtractedContent[] = [];

    for (const word of words) {
      // Create content text combining word info and all senses/translations
      const wordText = `${word.simplified}${word.traditional ? ` (${word.traditional})` : ''}`;
      const sensesText = word.senses
        .map(sense => {
          const translations = sense.translations
            .map(t => `${t.translation} (${t.language})`)
            .join(', ');
          return `${sense.partOfSpeech || ''} Translations: ${translations}`.trim();
        })
        .join(' | ');

      const combinedText = `Word: ${wordText}. Meanings: ${sensesText}`.trim();

      extractedContent.push({
        sourceType: SourceType.WORD,
        sourceId: word.id,
        text: combinedText,
        metadata: {
          simplified: word.simplified,
          traditional: word.traditional,
          sensesCount: word.senses.length,
        },
      });
    }

    this.logger.log(`Extracted ${extractedContent.length} word entries`);
    return extractedContent;
  }

  async extractGrammarContent(): Promise<ExtractedContent[]> {
    this.logger.log('Extracting grammar content for embedding...');
    
    const grammarPatterns = await this.grammarPatternRepository.find({
      relations: ['translations'],
    });

    const extractedContent: ExtractedContent[] = [];

    for (const pattern of grammarPatterns) {
      // Combine pattern info with translations
      const patternText = `Pattern: ${pattern.pattern}${pattern.patternPinyin ? ` (${pattern.patternPinyin})` : ''}`;
      const formulaText = pattern.patternFormula ? ` Formula: ${pattern.patternFormula}` : '';
      const translationsText = pattern.translations
        .map(t => `${t.explanation} (${t.language})`)
        .join(' | ');

      const combinedText = `${patternText}${formulaText}. Explanations: ${translationsText}`.trim();

      extractedContent.push({
        sourceType: SourceType.GRAMMAR,
        sourceId: pattern.id,
        text: combinedText,
        metadata: {
          pattern: pattern.pattern,
          patternPinyin: pattern.patternPinyin,
          patternFormula: pattern.patternFormula,
          hskLevel: pattern.hskLevel,
          translationsCount: pattern.translations.length,
        },
      });
    }

    this.logger.log(`Extracted ${extractedContent.length} grammar patterns`);
    return extractedContent;
  }

  async extractLessonContent(): Promise<ExtractedContent[]> {
    this.logger.log('Extracting lesson content for embedding...');
    
    const contents = await this.contentRepository.find({
      relations: ['lesson'],
      where: { isActive: true },
    });

    const extractedContent: ExtractedContent[] = [];

    for (const content of contents) {
      // Extract text from JSON data based on content type
      const extractedText = this.extractTextFromContentData(content.data, content.type);
      
      if (extractedText) {
        extractedContent.push({
          sourceType: SourceType.CONTENT,
          sourceId: content.id,
          text: extractedText,
          metadata: {
            lessonId: content.lessonId,
            lessonTitle: content.lesson?.name,
            contentType: content.type,
            orderIndex: content.orderIndex,
          },
        });
      }
    }

    this.logger.log(`Extracted ${extractedContent.length} lesson contents`);
    return extractedContent;
  }

  async extractQuestionContent(): Promise<ExtractedContent[]> {
    this.logger.log('Extracting question content for embedding...');
    
    const questions = await this.questionRepository.find({
      relations: ['lesson'],
      where: { isActive: true },
    });

    const extractedContent: ExtractedContent[] = [];

    for (const question of questions) {
      // Extract text from JSON data
      const extractedText = this.extractTextFromQuestionData(question.data, question.questionType);
      
      if (extractedText) {
        extractedContent.push({
          sourceType: SourceType.QUESTION,
          sourceId: question.id,
          text: extractedText,
          metadata: {
            lessonId: question.lessonId,
            lessonTitle: question.lesson?.name,
            questionType: question.questionType,
            orderIndex: question.orderIndex,
          },
        });
      }
    }

    this.logger.log(`Extracted ${extractedContent.length} questions`);
    return extractedContent;
  }

  private extractTextFromContentData(data: any, contentType: string): string {
    if (!data || typeof data !== 'object') return '';

    let text = '';

    // Extract based on common content fields
    if (data.title) text += `Title: ${data.title}. `;
    if (data.text) text += data.text + ' ';
    if (data.content) text += data.content + ' ';
    if (data.explanation) text += `Explanation: ${data.explanation}. `;
    if (data.description) text += `Description: ${data.description}. `;
    
    // Handle dialog content
    if (data.dialog && Array.isArray(data.dialog)) {
      const dialogText = data.dialog
        .map(line => `${line.speaker || ''}: ${line.text || line.content || ''}`)
        .join(' ');
      text += `Dialog: ${dialogText}. `;
    }

    // Handle vocabulary lists
    if (data.vocabulary && Array.isArray(data.vocabulary)) {
      const vocabText = data.vocabulary
        .map(item => `${item.word || item.chinese || ''} ${item.meaning || item.english || ''}`)
        .join(', ');
      text += `Vocabulary: ${vocabText}. `;
    }

    // Handle examples
    if (data.examples && Array.isArray(data.examples)) {
      const examplesText = data.examples
        .map(ex => `Example: ${ex.chinese || ex.text || ''} ${ex.english || ex.translation || ''}`)
        .join(' ');
      text += examplesText + ' ';
    }

    return text.trim();
  }

  private extractTextFromQuestionData(data: any, questionType: string): string {
    if (!data || typeof data !== 'object') return '';

    let text = '';

    // Extract question text
    if (data.question) text += `Question: ${data.question}. `;
    if (data.prompt) text += `Prompt: ${data.prompt}. `;
    if (data.instruction) text += `Instruction: ${data.instruction}. `;

    // Extract options for multiple choice
    if (data.options && Array.isArray(data.options)) {
      const optionsText = data.options
        .map((option, index) => `${String.fromCharCode(65 + index)}: ${option}`)
        .join(' ');
      text += `Options: ${optionsText}. `;
    }

    // Extract correct answer
    if (data.correctAnswer) text += `Answer: ${data.correctAnswer}. `;
    if (data.answer) text += `Answer: ${data.answer}. `;

    // Extract explanation
    if (data.explanation) text += `Explanation: ${data.explanation}. `;

    return text.trim();
  }

  async generateEmbeddingsForContent(extractedContent: ExtractedContent[]): Promise<void> {
    this.logger.log(`Generating embeddings for ${extractedContent.length} content items...`);

    const batchSize = 10; // Process in batches to avoid overwhelming the embedding service
    
    for (let i = 0; i < extractedContent.length; i += batchSize) {
      const batch = extractedContent.slice(i, i + batchSize);
      
      this.logger.debug(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(extractedContent.length/batchSize)}`);

      const texts = batch.map(item => item.text);
      const embeddings = await this.embeddingService.generateBatchEmbeddings(texts);

      // Save embeddings to database
      const embeddingEntities = batch.map((item, index) => ({
        sourceType: item.sourceType,
        sourceId: item.sourceId,
        contentText: item.text,
        embedding: embeddings[index],
        metadata: item.metadata,
        isActive: true,
      }));

      await this.embeddingRepository.save(embeddingEntities);
      
      // Small delay to be nice to the embedding service
      if (i + batchSize < extractedContent.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    this.logger.log(`Successfully generated and saved ${extractedContent.length} embeddings`);
  }

  async processAllContent(): Promise<void> {
    this.logger.log('Starting full content extraction and embedding process...');

    try {
      // Clear existing embeddings
      await this.embeddingRepository.delete({});
      this.logger.log('Cleared existing embeddings');

      // Extract all content types
      const [words, grammar, lessons, questions] = await Promise.all([
        this.extractWordContent(),
        this.extractGrammarContent(),
        this.extractLessonContent(),
        this.extractQuestionContent(),
      ]);

      const allContent = [...words, ...grammar, ...lessons, ...questions];
      this.logger.log(`Total extracted content items: ${allContent.length}`);

      // Generate embeddings
      if (allContent.length > 0) {
        await this.generateEmbeddingsForContent(allContent);
      }

      this.logger.log('Content extraction and embedding process completed successfully');
    } catch (error) {
      this.logger.error('Content extraction process failed:', error.stack);
      throw new Error(`Content extraction process failed: ${error.message}`);
    }
  }
}