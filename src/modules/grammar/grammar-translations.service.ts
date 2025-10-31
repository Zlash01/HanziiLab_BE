import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { GrammarTranslation } from './entities/grammar-translation.entity';
import { CreateGrammarTranslationDto } from './dto/create-grammar-translation.dto';
import { UpdateGrammarTranslationDto } from './dto/update-grammar-translation.dto';
import { GetGrammarTranslationsQueryDto } from './dto/get-grammar-translations-query.dto';

@Injectable()
export class GrammarTranslationsService {
  constructor(
    @InjectRepository(GrammarTranslation)
    private grammarTranslationRepository: Repository<GrammarTranslation>,
  ) {}

  async create(
    createGrammarTranslationDto: CreateGrammarTranslationDto,
  ): Promise<GrammarTranslation> {
    // Check if translation already exists for this pattern and language
    const existingTranslation = await this.grammarTranslationRepository.findOne(
      {
        where: {
          grammarPatternId: createGrammarTranslationDto.grammarPatternId,
          language: createGrammarTranslationDto.language,
        },
      },
    );

    if (existingTranslation) {
      throw new ConflictException(
        `Translation already exists for pattern ID ${createGrammarTranslationDto.grammarPatternId} in language '${createGrammarTranslationDto.language}'`,
      );
    }

    const translation = this.grammarTranslationRepository.create(
      createGrammarTranslationDto,
    );
    return await this.grammarTranslationRepository.save(translation);
  }

  async findAll(query: GetGrammarTranslationsQueryDto) {
    const {
      page = 1,
      limit = 10,
      grammarPatternId,
      language,
      search,
      sortBy = 'id',
      sortOrder = 'ASC',
    } = query;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<GrammarTranslation> = {};

    if (grammarPatternId) {
      where.grammarPatternId = grammarPatternId;
    }

    if (language) {
      where.language = language;
    }

    if (search) {
      // Search in grammarPoint or explanation
      where.grammarPoint = Like(`%${search}%`);
    }

    const validSortFields = [
      'id',
      'language',
      'grammarPoint',
      'grammarPatternId',
    ];
    const orderField = validSortFields.includes(sortBy) ? sortBy : 'id';
    const orderDirection = sortOrder === 'DESC' ? 'DESC' : 'ASC';

    const [translations, total] =
      await this.grammarTranslationRepository.findAndCount({
        where,
        relations: ['grammarPattern'],
        skip,
        take: limit,
        order: { [orderField]: orderDirection },
      });

    return {
      translations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<GrammarTranslation> {
    const translation = await this.grammarTranslationRepository.findOne({
      where: { id },
      relations: ['grammarPattern'],
    });

    if (!translation) {
      throw new NotFoundException(
        `Grammar translation with ID ${id} not found`,
      );
    }

    return translation;
  }

  async findByGrammarPatternId(
    grammarPatternId: number,
  ): Promise<GrammarTranslation[]> {
    return await this.grammarTranslationRepository.find({
      where: { grammarPatternId },
      relations: ['grammarPattern'],
      order: { language: 'ASC' },
    });
  }

  async findByLanguage(language: string): Promise<GrammarTranslation[]> {
    return await this.grammarTranslationRepository.find({
      where: { language },
      relations: ['grammarPattern'],
      order: { id: 'ASC' },
    });
  }

  async update(
    id: number,
    updateGrammarTranslationDto: UpdateGrammarTranslationDto,
  ): Promise<GrammarTranslation> {
    const translation = await this.findOne(id);

    // Check if language is being updated and if it creates a conflict
    if (
      updateGrammarTranslationDto.language &&
      updateGrammarTranslationDto.language !== translation.language
    ) {
      const existingTranslation =
        await this.grammarTranslationRepository.findOne({
          where: {
            grammarPatternId: translation.grammarPatternId,
            language: updateGrammarTranslationDto.language,
          },
        });

      if (existingTranslation) {
        throw new ConflictException(
          `Translation already exists for pattern ID ${translation.grammarPatternId} in language '${updateGrammarTranslationDto.language}'`,
        );
      }
    }

    await this.grammarTranslationRepository.update(
      id,
      updateGrammarTranslationDto,
    );
    return await this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const translation = await this.findOne(id);
    await this.grammarTranslationRepository.remove(translation);
  }

  async getStatistics() {
    const total = await this.grammarTranslationRepository.count();

    const languageDistribution = await this.grammarTranslationRepository
      .createQueryBuilder('translation')
      .select('translation.language', 'language')
      .addSelect('COUNT(*)', 'total')
      .groupBy('translation.language')
      .orderBy('translation.language', 'ASC')
      .getRawMany();

    return {
      total,
      languageDistribution,
    };
  }
}
