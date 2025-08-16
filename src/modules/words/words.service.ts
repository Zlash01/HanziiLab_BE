import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Word } from './entities/word.entity';
import { CreateWordDto } from './dto/create-word.dto';
import { UpdateWordDto } from './dto/update-word.dto';
import { GetWordsQueryDto } from './dto/get-words-query.dto';

@Injectable()
export class WordsService {
  constructor(
    @InjectRepository(Word)
    private wordsRepository: Repository<Word>,
  ) {}

  // Create a new word
  async create(createWordDto: CreateWordDto): Promise<Word> {
    // Check if word with same simplified already exists
    const existingWord = await this.wordsRepository.findOne({
      where: { simplified: createWordDto.simplified },
    });
    if (existingWord) {
      throw new BadRequestException(
        'Word with this simplified form already exists',
      );
    }

    const word = this.wordsRepository.create(createWordDto);
    return this.wordsRepository.save(word);
  }

  // Get all words with pagination and filtering
  async findAll(
    query: GetWordsQueryDto,
  ): Promise<{ words: Word[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      search,
      characterCount,
      isCompound,
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

    if (characterCount !== undefined) {
      queryBuilder.andWhere('word.characterCount = :characterCount', {
        characterCount,
      });
    }

    if (isCompound !== undefined) {
      queryBuilder.andWhere('word.isCompound = :isCompound', { isCompound });
    }

    // Apply sorting
    queryBuilder.orderBy(`word.${sortBy}`, sortOrder);

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Include relations
    queryBuilder.leftJoinAndSelect('word.senses', 'senses');

    const [words, total] = await queryBuilder.getManyAndCount();

    return { words, total };
  }

  // Get word by ID
  async findById(id: number): Promise<Word> {
    const word = await this.wordsRepository.findOne({
      where: { id },
      relations: ['senses', 'senses.translations'],
    });

    if (!word) {
      throw new NotFoundException(`Word with ID ${id} not found`);
    }

    return word;
  }

  // Get word by simplified form
  async findBySimplified(simplified: string): Promise<Word> {
    const word = await this.wordsRepository.findOne({
      where: { simplified },
      relations: ['senses', 'senses.translations'],
    });

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
    const compound = await this.wordsRepository.count({
      where: { isCompound: true },
    });
    const single = total - compound;

    const characterCounts = await this.wordsRepository
      .createQueryBuilder('word')
      .select('word.characterCount', 'count')
      .addSelect('COUNT(*)', 'total')
      .groupBy('word.characterCount')
      .orderBy('word.characterCount')
      .getRawMany();

    return {
      total,
      single,
      compound,
      characterCounts,
    };
  }
}
