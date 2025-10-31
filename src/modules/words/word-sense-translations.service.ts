import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WordSenseTranslation } from './entities/word-sense-translation.entity';
import { CreateWordSenseTranslationDto } from './dto/create-word-sense-translation.dto';
import { UpdateWordSenseTranslationDto } from './dto/update-word-sense-translation.dto';
import { GetWordSenseTranslationsQueryDto } from './dto/get-word-sense-translations-query.dto';

@Injectable()
export class WordSenseTranslationsService {
  constructor(
    @InjectRepository(WordSenseTranslation)
    private wordSenseTranslationsRepository: Repository<WordSenseTranslation>,
  ) {}

  // Create a new word sense translation
  async create(
    createWordSenseTranslationDto: CreateWordSenseTranslationDto,
  ): Promise<WordSenseTranslation> {
    // Check if translation with same word_sense_id and language already exists
    const existingTranslation =
      await this.wordSenseTranslationsRepository.findOne({
        where: {
          wordSenseId: createWordSenseTranslationDto.wordSenseId,
          language: createWordSenseTranslationDto.language,
        },
      });
    if (existingTranslation) {
      throw new BadRequestException(
        'Translation for this word sense and language already exists',
      );
    }

    const translation = this.wordSenseTranslationsRepository.create(
      createWordSenseTranslationDto,
    );
    return this.wordSenseTranslationsRepository.save(translation);
  }

  // Get all word sense translations with pagination and filtering
  async findAll(
    query: GetWordSenseTranslationsQueryDto,
  ): Promise<{ translations: WordSenseTranslation[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      wordSenseId,
      language,
      search,
      sortBy = 'id',
      sortOrder = 'ASC',
    } = query;

    const queryBuilder =
      this.wordSenseTranslationsRepository.createQueryBuilder('translation');

    // Apply filters
    if (wordSenseId) {
      queryBuilder.andWhere('translation.wordSenseId = :wordSenseId', {
        wordSenseId,
      });
    }

    if (language) {
      queryBuilder.andWhere('translation.language = :language', { language });
    }

    if (search) {
      queryBuilder.andWhere(
        '(translation.translation LIKE :search OR translation.additionalDetail LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Apply sorting
    queryBuilder.orderBy(`translation.${sortBy}`, sortOrder);

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Include relations
    queryBuilder.leftJoinAndSelect('translation.wordSense', 'wordSense');
    queryBuilder.leftJoinAndSelect('wordSense.word', 'word');

    const [translations, total] = await queryBuilder.getManyAndCount();

    return { translations, total };
  }

  // Get word sense translation by ID
  async findById(id: number): Promise<WordSenseTranslation> {
    const translation = await this.wordSenseTranslationsRepository.findOne({
      where: { id },
      relations: ['wordSense', 'wordSense.word'],
    });

    if (!translation) {
      throw new NotFoundException(
        `Word sense translation with ID ${id} not found`,
      );
    }

    return translation;
  }

  // Get translations by word sense ID
  async findByWordSenseId(
    wordSenseId: number,
  ): Promise<WordSenseTranslation[]> {
    return this.wordSenseTranslationsRepository.find({
      where: { wordSenseId },
      order: { language: 'ASC' },
    });
  }

  // Get translations by language
  async findByLanguage(language: string): Promise<WordSenseTranslation[]> {
    return this.wordSenseTranslationsRepository.find({
      where: { language },
      relations: ['wordSense', 'wordSense.word'],
      order: { id: 'ASC' },
    });
  }

  // Update word sense translation
  async update(
    id: number,
    updateWordSenseTranslationDto: UpdateWordSenseTranslationDto,
  ): Promise<WordSenseTranslation> {
    const translation = await this.findById(id);

    // If updating language, check for conflicts
    if (
      updateWordSenseTranslationDto.language &&
      updateWordSenseTranslationDto.language !== translation.language
    ) {
      const existingTranslation =
        await this.wordSenseTranslationsRepository.findOne({
          where: {
            wordSenseId: translation.wordSenseId,
            language: updateWordSenseTranslationDto.language,
          },
        });
      if (existingTranslation) {
        throw new BadRequestException(
          'Translation for this word sense and language already exists',
        );
      }
    }

    Object.assign(translation, updateWordSenseTranslationDto);
    return this.wordSenseTranslationsRepository.save(translation);
  }

  // Delete word sense translation
  async remove(id: number): Promise<void> {
    const translation = await this.findById(id);
    await this.wordSenseTranslationsRepository.remove(translation);
  }

  // Get word sense translation statistics
  async getTranslationStats() {
    const total = await this.wordSenseTranslationsRepository.count();

    const languageDistribution = await this.wordSenseTranslationsRepository
      .createQueryBuilder('translation')
      .select('translation.language', 'language')
      .addSelect('COUNT(*)', 'total')
      .groupBy('translation.language')
      .orderBy('total', 'DESC')
      .getRawMany();

    return {
      total,
      languageDistribution,
    };
  }
}
