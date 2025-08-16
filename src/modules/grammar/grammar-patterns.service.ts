import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { GrammarPattern } from './entities/grammar-pattern.entity';
import { CreateGrammarPatternDto } from './dto/create-grammar-pattern.dto';
import { UpdateGrammarPatternDto } from './dto/update-grammar-pattern.dto';
import { GetGrammarPatternsQueryDto } from './dto/get-grammar-patterns-query.dto';

@Injectable()
export class GrammarPatternsService {
  constructor(
    @InjectRepository(GrammarPattern)
    private grammarPatternRepository: Repository<GrammarPattern>,
  ) {}

  async create(
    createGrammarPatternDto: CreateGrammarPatternDto,
  ): Promise<GrammarPattern> {
    // Check if pattern already exists
    const existingPattern = await this.grammarPatternRepository.findOne({
      where: { pattern: createGrammarPatternDto.pattern },
    });

    if (existingPattern) {
      throw new ConflictException(
        `Grammar pattern '${createGrammarPatternDto.pattern}' already exists`,
      );
    }

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
      difficultyLevel,
      sortBy = 'id',
      sortOrder = 'ASC',
    } = query;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<GrammarPattern> = {};

    if (search) {
      where.pattern = Like(`%${search}%`);
    }

    if (hskLevel) {
      where.hskLevel = hskLevel;
    }

    if (difficultyLevel) {
      where.difficultyLevel = difficultyLevel;
    }

    const validSortFields = [
      'id',
      'pattern',
      'hskLevel',
      'difficultyLevel',
      'createdAt',
    ];
    const orderField = validSortFields.includes(sortBy) ? sortBy : 'id';
    const orderDirection = sortOrder === 'DESC' ? 'DESC' : 'ASC';

    const [patterns, total] = await this.grammarPatternRepository.findAndCount({
      where,
      relations: ['translations'],
      skip,
      take: limit,
      order: { [orderField]: orderDirection },
    });

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
    const pattern = await this.findOne(id);

    // Check if pattern name is being updated and if it already exists
    if (
      updateGrammarPatternDto.pattern &&
      updateGrammarPatternDto.pattern !== pattern.pattern
    ) {
      const existingPattern = await this.grammarPatternRepository.findOne({
        where: { pattern: updateGrammarPatternDto.pattern },
      });

      if (existingPattern) {
        throw new ConflictException(
          `Grammar pattern '${updateGrammarPatternDto.pattern}' already exists`,
        );
      }
    }

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

    const difficultyDistribution = await this.grammarPatternRepository
      .createQueryBuilder('pattern')
      .select('pattern.difficultyLevel', 'level')
      .addSelect('COUNT(*)', 'total')
      .where('pattern.difficultyLevel IS NOT NULL')
      .groupBy('pattern.difficultyLevel')
      .orderBy('pattern.difficultyLevel', 'ASC')
      .getRawMany();

    return {
      total,
      hskLevelDistribution,
      difficultyDistribution,
    };
  }
}
