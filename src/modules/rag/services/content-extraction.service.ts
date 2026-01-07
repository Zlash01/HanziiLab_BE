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

interface QuestionTypeComponents {
  action: string; // SELECTION, MATCHING, FILL, BOOL
  inputType: string; // TEXT, AUDIO, IMAGE
  outputType: string; // TEXT, IMAGE
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
      // pattern and patternPinyin are now string[] arrays, join them for display
      const patternStr = Array.isArray(pattern.pattern) ? pattern.pattern.join('') : pattern.pattern;
      const pinyinStr = Array.isArray(pattern.patternPinyin) ? pattern.patternPinyin.join(' ') : pattern.patternPinyin;
      const patternText = `Pattern: ${patternStr}${pinyinStr ? ` (${pinyinStr})` : ''}`;
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
          pattern: patternStr, // Store as joined string in metadata for search
          patternPinyin: pinyinStr,
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
        // Parse question type for richer metadata
        const typeComponents = this.parseQuestionType(question.questionType);

        extractedContent.push({
          sourceType: SourceType.QUESTION,
          sourceId: question.id,
          text: extractedText,
          metadata: {
            lessonId: question.lessonId,
            lessonTitle: question.lesson?.name,
            questionType: question.questionType,
            questionAction: typeComponents.action, // SELECTION, MATCHING, FILL, BOOL
            questionInputType: typeComponents.inputType, // TEXT, AUDIO, IMAGE
            questionOutputType: typeComponents.outputType, // TEXT, IMAGE
            orderIndex: question.orderIndex,
            hasAudio: question.data?.audioUrl !== undefined,
            hasImage: question.data?.imageUrl !== undefined,
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

  /**
   * Extract display text from TextContent object (selection questions, fill questions)
   * Supports both new TextContent format and legacy string format
   */
  private extractTextFromTextContent(content: any): string {
    if (!content) return '';
    
    // Legacy string format
    if (typeof content === 'string') return content;
    
    // New TextContent format - Chinese mode
    if (content.chinese && Array.isArray(content.chinese) && content.chinese.length > 0) {
      const chinese = content.chinese.join('');
      const pinyin = content.pinyin?.join(' ') || '';
      return pinyin ? `${chinese} (${pinyin})` : chinese;
    }
    
    // New TextContent format - Simple text mode
    if (content.text) return content.text;
    
    return '';
  }

  private extractTextFromQuestionData(data: any, questionType: string): string {
    if (!data || typeof data !== 'object') return '';

    let text = '';
    const typeComponents = this.parseQuestionType(questionType);

    // Add context about question type for better semantic understanding
    text += `${typeComponents.action} question. `;

    // Extract question text - new format first, fallback to legacy
    if (data.questionContent) {
      text += `Question: ${this.extractTextFromTextContent(data.questionContent)}. `;
    } else if (data.question) {
      text += `Question: ${data.question}. `;
    }
    if (data.prompt) text += `Prompt: ${data.prompt}. `;
    if (data.instruction) text += `Instruction: ${data.instruction}. `;
    if (data.text) text += `${data.text}. `;

    // Handle audio input types
    if (typeComponents.inputType === 'AUDIO' && data.audioUrl) {
      text += `Audio content available at: ${data.audioUrl}. `;
    }

    // Handle image input types
    if (typeComponents.inputType === 'IMAGE' && data.imageUrl) {
      text += `Image content available at: ${data.imageUrl}. `;
    }

    // Extract options for selection/matching questions - handle both formats
    if (data.options && Array.isArray(data.options)) {
      const optionsText = data.options
        .map((option, index) => {
          // Try new format: option.content (TextContent)
          if (option.content) {
            return `${String.fromCharCode(65 + index)}: ${this.extractTextFromTextContent(option.content)}`;
          }
          // Legacy format: option.text (string)
          if (option.text) {
            return `${String.fromCharCode(65 + index)}: ${option.text}`;
          }
          // Plain string option
          if (typeof option === 'string') {
            return `${String.fromCharCode(65 + index)}: ${option}`;
          }
          // Handle image/audio options
          if (typeof option === 'object') {
            let optText = `${String.fromCharCode(65 + index)}:`;
            if (option.imageUrl) optText += ` [Image: ${option.imageUrl}]`;
            if (option.audioUrl) optText += ` [Audio: ${option.audioUrl}]`;
            return optText;
          }
          return '';
        })
        .filter(opt => opt)
        .join(' ');
      text += `Options: ${optionsText}. `;
    }

    // Handle new FillTextText segments format
    if (data.segments && Array.isArray(data.segments)) {
      const segmentsText = data.segments
        .map(segment => {
          if (segment.type === 'text' && segment.content) {
            return this.extractTextFromTextContent(segment.content);
          }
          if (segment.type === 'blank') {
            return `[BLANK ${segment.blankIndex}]`;
          }
          return '';
        })
        .join(' ');
      text += `Sentence: ${segmentsText}. `;
    }

    // Handle new option bank format (FillTextText)
    if (data.optionBankItems && Array.isArray(data.optionBankItems)) {
      const bankText = data.optionBankItems
        .map(item => this.extractTextFromTextContent(item))
        .join(', ');
      text += `Option bank: ${bankText}. `;
    }

    // Handle new blank answers format (FillTextText)
    if (data.blankAnswers && Array.isArray(data.blankAnswers)) {
      const answersText = data.blankAnswers
        .map(blank => {
          const answers = blank.correctAnswers
            ?.map(a => this.extractTextFromTextContent(a))
            .join(' or ');
          return `Blank ${blank.index}: ${answers}`;
        })
        .join('; ');
      text += `Answers: ${answersText}. `;
    }

    // Extract pairs for matching questions
    if (data.pairs && Array.isArray(data.pairs)) {
      const pairsText = data.pairs
        .map((pair, index) => {
          const left = pair.left || pair.question || '';
          const right = pair.right || pair.answer || '';
          return `Pair ${index + 1}: ${left} matches ${right}`;
        })
        .join('; ');
      text += `Matching pairs: ${pairsText}. `;
    }

    // Extract blanks for fill-in questions (legacy format)
    if (data.blanks && Array.isArray(data.blanks)) {
      const blanksText = data.blanks
        .map((blank, index) => {
          if (typeof blank === 'object' && blank.correct) {
            return `Blank ${blank.index || index + 1}: ${blank.correct.join(' or ')}`;
          }
          return `Blank ${index + 1}: ${blank}`;
        })
        .join(', ');
      text += `Fill-in blanks: ${blanksText}. `;
    }

    // Extract correct answer
    if (data.correctAnswer !== undefined) {
      text += `Answer: ${data.correctAnswer}. `;
    }
    if (data.answer !== undefined) {
      text += `Answer: ${data.answer}. `;
    }
    if (data.correctAnswers && Array.isArray(data.correctAnswers)) {
      text += `Answers: ${data.correctAnswers.join(', ')}. `;
    }

    // Extract explanation
    if (data.explanation) text += `Explanation: ${data.explanation}. `;
    if (data.hint) text += `Hint: ${data.hint}. `;

    return text.trim();
  }

  /**
   * Parse question type enum into its components
   * Format: question_{action}_{inputType}_{outputType}
   * Example: question_selection_audio_text -> { action: 'SELECTION', inputType: 'AUDIO', outputType: 'TEXT' }
   */
  private parseQuestionType(questionType: string): QuestionTypeComponents {
    // Remove 'question_' prefix and split by underscore
    const parts = questionType.replace('question_', '').split('_');

    if (parts.length >= 3) {
      return {
        action: parts[0].toUpperCase(), // SELECTION, MATCHING, FILL, BOOL
        inputType: parts[1].toUpperCase(), // TEXT, AUDIO, IMAGE
        outputType: parts[2].toUpperCase(), // TEXT, IMAGE
      };
    }

    // Fallback for unexpected format
    return {
      action: 'UNKNOWN',
      inputType: 'TEXT',
      outputType: 'TEXT',
    };
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