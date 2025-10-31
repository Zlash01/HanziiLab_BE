import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { GrammarPattern } from './entities/grammar-pattern.entity';
import { GrammarTranslation } from './entities/grammar-translation.entity';
import { CreateGrammarPatternDto } from './dto/create-grammar-pattern.dto';
import { UpdateGrammarPatternDto } from './dto/update-grammar-pattern.dto';
import { GetGrammarPatternsQueryDto } from './dto/get-grammar-patterns-query.dto';
import { CreateCompleteGrammarPatternDto } from './dto/create-complete-grammar-pattern.dto';
import { UpdateCompleteGrammarPatternDto } from './dto/update-complete-grammar-pattern.dto';

@Injectable()
export class GrammarPatternsService {
  constructor(
    @InjectRepository(GrammarPattern)
    private grammarPatternRepository: Repository<GrammarPattern>,
    @InjectRepository(GrammarTranslation)
    private grammarTranslationRepository: Repository<GrammarTranslation>,
  ) {}

  async create(
    createGrammarPatternDto: CreateGrammarPatternDto,
  ): Promise<GrammarPattern> {
    const grammarPattern = this.grammarPatternRepository.create(
      createGrammarPatternDto,
    );
    return await this.grammarPatternRepository.save(grammarPattern);
  }

  async findAll(query: GetGrammarPatternsQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      hskLevel,
      sortBy = 'id',
      sortOrder = 'ASC',
    } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.grammarPatternRepository
      .createQueryBuilder('pattern')
      .leftJoinAndSelect('pattern.translations', 'translations');

    // Search in JSON pattern field
    if (search) {
      queryBuilder.andWhere(
        "JSON_SEARCH(pattern.pattern, 'one', :search) IS NOT NULL",
        { search: `%${search}%` },
      );
    }

    if (hskLevel) {
      queryBuilder.andWhere('pattern.hskLevel = :hskLevel', { hskLevel });
    }

    const validSortFields = ['id', 'hskLevel', 'createdAt'];
    const orderField = validSortFields.includes(sortBy) ? sortBy : 'id';
    const orderDirection = sortOrder === 'DESC' ? 'DESC' : 'ASC';

    queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy(`pattern.${orderField}`, orderDirection);

    const [patterns, total] = await queryBuilder.getManyAndCount();

    return {
      patterns,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<GrammarPattern> {
    const pattern = await this.grammarPatternRepository.findOne({
      where: { id },
      relations: ['translations'],
    });

    if (!pattern) {
      throw new NotFoundException(`Grammar pattern with ID ${id} not found`);
    }

    return pattern;
  }

  async findByPattern(pattern: string): Promise<GrammarPattern> {
    const grammarPattern = await this.grammarPatternRepository.findOne({
      where: { pattern },
      relations: ['translations'],
    });

    if (!grammarPattern) {
      throw new NotFoundException(`Grammar pattern '${pattern}' not found`);
    }

    return grammarPattern;
  }

  async update(
    id: number,
    updateGrammarPatternDto: UpdateGrammarPatternDto,
  ): Promise<GrammarPattern> {
    await this.findOne(id); // Verify pattern exists

    await this.grammarPatternRepository.update(id, updateGrammarPatternDto);
    return await this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const pattern = await this.findOne(id);
    await this.grammarPatternRepository.remove(pattern);
  }

  async getStatistics() {
    const total = await this.grammarPatternRepository.count();

    const hskLevelDistribution = await this.grammarPatternRepository
      .createQueryBuilder('pattern')
      .select('pattern.hskLevel', 'level')
      .addSelect('COUNT(*)', 'total')
      .where('pattern.hskLevel IS NOT NULL')
      .groupBy('pattern.hskLevel')
      .orderBy('pattern.hskLevel', 'ASC')
      .getRawMany();

    return {
      total,
      hskLevelDistribution,
    };
  }

  /**
   * Create complete pattern with translation
   * Two scenarios:
   * 1. patternId not provided: Create new pattern + translation
   * 2. patternId provided: Add translation to existing pattern
   */
  async createComplete(
    dto: CreateCompleteGrammarPatternDto,
  ): Promise<GrammarPattern> {
    let grammarPattern: GrammarPattern;

    // Scenario 1: Create new pattern
    if (!dto.patternId) {
      if (!dto.pattern) {
        throw new BadRequestException(
          'Pattern data is required when patternId is not provided',
        );
      }

      grammarPattern = this.grammarPatternRepository.create(dto.pattern);
      grammarPattern = await this.grammarPatternRepository.save(grammarPattern);
    }
    // Scenario 2: Use existing pattern
    else {
      const foundPattern = await this.grammarPatternRepository.findOne({
        where: { id: dto.patternId },
        relations: ['translations'],
      });

      if (!foundPattern) {
        throw new NotFoundException(
          `Grammar pattern with ID ${dto.patternId} not found`,
        );
      }

      grammarPattern = foundPattern;

      // Check if translation for this language already exists
      const existingTranslation = grammarPattern.translations?.find(
        (t) => t.language === (dto.translation.language || 'vn'),
      );

      if (existingTranslation) {
        throw new ConflictException(
          `Translation for language "${dto.translation.language || 'vn'}" already exists for this pattern`,
        );
      }
    }

    // Create translation
    const translation = this.grammarTranslationRepository.create({
      grammarPatternId: grammarPattern.id,
      language: dto.translation.language || 'vn',
      grammarPoint: dto.translation.grammarPoint,
      explanation: dto.translation.explanation,
      example: dto.translation.example,
    });

    await this.grammarTranslationRepository.save(translation);

    // Return complete pattern with all translations
    return await this.findOne(grammarPattern.id);
  }

  /**
   * Update complete pattern by translation ID
   */
  async updateCompleteByTranslationId(
    translationId: number,
    dto: UpdateCompleteGrammarPatternDto,
  ): Promise<GrammarPattern> {
    // Find translation
    const translation = await this.grammarTranslationRepository.findOne({
      where: { id: translationId },
      relations: ['grammarPattern'],
    });

    if (!translation) {
      throw new NotFoundException(
        `Grammar translation with ID ${translationId} not found`,
      );
    }

    const patternId = translation.grammarPatternId;

    // Update pattern if provided
    if (dto.pattern && Object.keys(dto.pattern).length > 0) {
      await this.grammarPatternRepository.update(patternId, dto.pattern);
    }

    // Update translation if provided
    if (dto.translation && Object.keys(dto.translation).length > 0) {
      await this.grammarTranslationRepository.update(
        translationId,
        dto.translation,
      );
    }

    // Return updated complete pattern
    return await this.findOne(patternId);
  }
}
