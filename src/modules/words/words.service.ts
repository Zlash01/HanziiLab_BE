import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Word } from './entities/word.entity';
import { WordSense } from './entities/word-sense.entity';
import { WordSenseTranslation } from './entities/word-sense-translation.entity';
import { CreateWordDto } from './dto/create-word.dto';
import { UpdateWordDto } from './dto/update-word.dto';
import { GetWordsQueryDto } from './dto/get-words-query.dto';
import { CreateCompleteWordDto } from './dto/create-complete-word.dto';
import { UpdateCompleteWordDto } from './dto/update-complete-word.dto';

@Injectable()
export class WordsService {
  constructor(
    @InjectRepository(Word)
    private wordsRepository: Repository<Word>,
    @InjectRepository(WordSense)
    private wordSensesRepository: Repository<WordSense>,
    @InjectRepository(WordSenseTranslation)
    private wordSenseTranslationsRepository: Repository<WordSenseTranslation>,
  ) {}

  // Create a new word
  async create(createWordDto: CreateWordDto): Promise<Word> {
    const word = this.wordsRepository.create(createWordDto);
    return this.wordsRepository.save(word);
  }

  // Get all words with pagination and filtering
  async findAll(
    query: GetWordsQueryDto,
  ): Promise<{ words: Word[]; total: number; page: number; totalPages: number }> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'id',
      sortOrder = 'ASC',
    } = query;

    const queryBuilder = this.wordsRepository.createQueryBuilder('word');

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(word.simplified LIKE :search OR word.traditional LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Apply sorting
    queryBuilder.orderBy(`word.${sortBy}`, sortOrder);

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Include relations with Vietnamese translations only
    queryBuilder.leftJoinAndSelect('word.senses', 'senses');
    queryBuilder.leftJoinAndSelect(
      'senses.translations',
      'translations',
      'translations.language = :language',
      { language: 'vn' },
    );
    queryBuilder.orderBy('senses.senseNumber', 'ASC');

    const [words, total] = await queryBuilder.getManyAndCount();

    return {
      words,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Get word by ID with Vietnamese translations
  async findById(id: number): Promise<Word> {
    const word = await this.wordsRepository
      .createQueryBuilder('word')
      .leftJoinAndSelect('word.senses', 'senses')
      .leftJoinAndSelect(
        'senses.translations',
        'translations',
        'translations.language = :language',
        { language: 'vn' },
      )
      .where('word.id = :id', { id })
      .orderBy('senses.senseNumber', 'ASC')
      .getOne();

    if (!word) {
      throw new NotFoundException(`Word with ID ${id} not found`);
    }

    return word;
  }

  // Get word by simplified form with Vietnamese translations
  async findBySimplified(simplified: string): Promise<Word> {
    const word = await this.wordsRepository
      .createQueryBuilder('word')
      .leftJoinAndSelect('word.senses', 'senses')
      .leftJoinAndSelect(
        'senses.translations',
        'translations',
        'translations.language = :language',
        { language: 'vn' },
      )
      .where('word.simplified = :simplified', { simplified })
      .orderBy('senses.senseNumber', 'ASC')
      .getOne();

    if (!word) {
      throw new NotFoundException(`Word "${simplified}" not found`);
    }

    return word;
  }

  // Update word
  async update(id: number, updateWordDto: UpdateWordDto): Promise<Word> {
    const word = await this.findById(id);

    // If updating simplified, check for conflicts
    if (
      updateWordDto.simplified &&
      updateWordDto.simplified !== word.simplified
    ) {
      const existingWord = await this.wordsRepository.findOne({
        where: { simplified: updateWordDto.simplified },
      });
      if (existingWord) {
        throw new BadRequestException(
          'Word with this simplified form already exists',
        );
      }
    }

    Object.assign(word, updateWordDto);
    return this.wordsRepository.save(word);
  }

  // Delete word
  async remove(id: number): Promise<void> {
    const word = await this.findById(id);
    await this.wordsRepository.remove(word);
  }

  // Get word statistics
  async getWordStats() {
    const total = await this.wordsRepository.count();

    return {
      total,
    };
  }

  // Search for word by simplified form (for existence check)
  async search(simplified: string) {
    const word = await this.wordsRepository
      .createQueryBuilder('word')
      .leftJoinAndSelect('word.senses', 'senses')
      .leftJoinAndSelect(
        'senses.translations',
        'translations',
        'translations.language = :language',
        { language: 'vn' },
      )
      .where('word.simplified = :simplified', { simplified })
      .orderBy('senses.senseNumber', 'ASC')
      .getOne();

    if (!word) {
      return {
        exists: false,
        wordId: null,
        word: null,
      };
    }

    return {
      exists: true,
      wordId: word.id,
      word,
    };
  }

  // Get next sense number for a word
  async getNextSenseNumber(wordId: number): Promise<number> {
    const maxSenseNumber = await this.wordSensesRepository
      .createQueryBuilder('wordSense')
      .select('MAX(wordSense.senseNumber)', 'max')
      .where('wordSense.wordId = :wordId', { wordId })
      .getRawOne();

    return (maxSenseNumber?.max || 0) + 1;
  }

  // Create complete word (word + sense + translation)
  async createComplete(
    createCompleteWordDto: CreateCompleteWordDto,
  ): Promise<Word> {
    let wordId = createCompleteWordDto.wordId;

    // If wordId not provided, create new word
    if (!wordId) {
      if (!createCompleteWordDto.word) {
        throw new BadRequestException(
          'Word data is required when wordId is not provided',
        );
      }

      // Check if word already exists
      const existingWord = await this.wordsRepository.findOne({
        where: { simplified: createCompleteWordDto.word.simplified },
      });

      if (existingWord) {
        throw new BadRequestException(
          'Word with this simplified form already exists. Use wordId to add a new sense.',
        );
      }

      const newWord = this.wordsRepository.create(createCompleteWordDto.word);
      const savedWord = await this.wordsRepository.save(newWord);
      wordId = savedWord.id;
    }

    // Get next sense number
    const nextSenseNumber = await this.getNextSenseNumber(wordId);

    // Create word sense
    const wordSense = this.wordSensesRepository.create({
      wordId,
      senseNumber: nextSenseNumber,
      ...createCompleteWordDto.sense,
    });
    const savedWordSense = await this.wordSensesRepository.save(wordSense);

    // Create translation
    const translation = this.wordSenseTranslationsRepository.create({
      wordSenseId: savedWordSense.id,
      language: createCompleteWordDto.translation.language || 'vn',
      translation: createCompleteWordDto.translation.translation,
      additionalDetail: createCompleteWordDto.translation.additionalDetail,
    });
    await this.wordSenseTranslationsRepository.save(translation);

    // Return complete word with all relations
    return this.findById(wordId);
  }

  // Update complete word (word + sense + translation)
  async updateCompleteBySenseId(
    senseId: number,
    updateCompleteWordDto: UpdateCompleteWordDto,
  ): Promise<Word> {
    // Find the word sense
    const wordSense = await this.wordSensesRepository.findOne({
      where: { id: senseId },
      relations: ['word', 'translations'],
    });

    if (!wordSense) {
      throw new NotFoundException(`Word sense with ID ${senseId} not found`);
    }

    // Update word if provided
    if (updateCompleteWordDto.word) {
      const word = wordSense.word;

      // If updating simplified, check for conflicts
      if (
        updateCompleteWordDto.word.simplified &&
        updateCompleteWordDto.word.simplified !== word.simplified
      ) {
        const existingWord = await this.wordsRepository.findOne({
          where: { simplified: updateCompleteWordDto.word.simplified },
        });
        if (existingWord && existingWord.id !== word.id) {
          throw new BadRequestException(
            'Word with this simplified form already exists',
          );
        }
      }

      Object.assign(word, updateCompleteWordDto.word);
      await this.wordsRepository.save(word);
    }

    // Update sense if provided
    if (updateCompleteWordDto.sense) {
      Object.assign(wordSense, updateCompleteWordDto.sense);
      await this.wordSensesRepository.save(wordSense);
    }

    // Update translation if provided
    if (updateCompleteWordDto.translation) {
      const vnTranslation = wordSense.translations.find(
        (t) => t.language === 'vn',
      );

      if (vnTranslation) {
        Object.assign(vnTranslation, updateCompleteWordDto.translation);
        await this.wordSenseTranslationsRepository.save(vnTranslation);
      } else {
        // Create new translation if doesn't exist
        const newTranslation = this.wordSenseTranslationsRepository.create({
          wordSenseId: wordSense.id,
          language: 'vn',
          ...updateCompleteWordDto.translation,
        });
        await this.wordSenseTranslationsRepository.save(newTranslation);
      }
    }

    // Return complete word with all relations
    return this.findById(wordSense.wordId);
  }
}
