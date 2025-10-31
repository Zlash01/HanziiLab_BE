import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WordSense } from './entities/word-sense.entity';
import { CreateWordSenseDto } from './dto/create-word-sense.dto';
import { UpdateWordSenseDto } from './dto/update-word-sense.dto';
import { GetWordSensesQueryDto } from './dto/get-word-senses-query.dto';

@Injectable()
export class WordSensesService {
  constructor(
    @InjectRepository(WordSense)
    private wordSensesRepository: Repository<WordSense>,
  ) {}

  // Get next sense number for a word
  async getNextSenseNumber(wordId: number): Promise<number> {
    const maxSenseNumber = await this.wordSensesRepository
      .createQueryBuilder('wordSense')
      .select('MAX(wordSense.senseNumber)', 'max')
      .where('wordSense.wordId = :wordId', { wordId })
      .getRawOne();

    return (maxSenseNumber?.max || 0) + 1;
  }

  // Create a new word sense (auto-generates senseNumber)
  async create(createWordSenseDto: CreateWordSenseDto): Promise<WordSense> {
    const nextSenseNumber = await this.getNextSenseNumber(
      createWordSenseDto.wordId,
    );

    const wordSense = this.wordSensesRepository.create({
      ...createWordSenseDto,
      senseNumber: nextSenseNumber,
    });
    return this.wordSensesRepository.save(wordSense);
  }

  // Get all word senses with pagination and filtering
  async findAll(
    query: GetWordSensesQueryDto,
  ): Promise<{ wordSenses: WordSense[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      wordId,
      search,
      hskLevel,
      partOfSpeech,
      sortBy = 'id',
      sortOrder = 'ASC',
    } = query;

    const queryBuilder =
      this.wordSensesRepository.createQueryBuilder('wordSense');

    // Apply filters
    if (wordId) {
      queryBuilder.andWhere('wordSense.wordId = :wordId', { wordId });
    }

    if (search) {
      queryBuilder.andWhere('(wordSense.pinyin LIKE :search)', {
        search: `%${search}%`,
      });
    }

    if (hskLevel !== undefined) {
      queryBuilder.andWhere('wordSense.hskLevel = :hskLevel', { hskLevel });
    }

    if (partOfSpeech) {
      queryBuilder.andWhere('wordSense.partOfSpeech = :partOfSpeech', {
        partOfSpeech,
      });
    }

    // Apply sorting
    queryBuilder.orderBy(`wordSense.${sortBy}`, sortOrder);

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Include relations
    queryBuilder.leftJoinAndSelect('wordSense.word', 'word');
    queryBuilder.leftJoinAndSelect('wordSense.translations', 'translations');

    const [wordSenses, total] = await queryBuilder.getManyAndCount();

    return { wordSenses, total };
  }

  // Get word sense by ID
  async findById(id: number): Promise<WordSense> {
    const wordSense = await this.wordSensesRepository.findOne({
      where: { id },
      relations: ['word', 'translations'],
    });

    if (!wordSense) {
      throw new NotFoundException(`Word sense with ID ${id} not found`);
    }

    return wordSense;
  }

  // Get word senses by word ID
  async findByWordId(wordId: number): Promise<WordSense[]> {
    return this.wordSensesRepository.find({
      where: { wordId },
      relations: ['translations'],
      order: { senseNumber: 'ASC' },
    });
  }

  // Update word sense
  async update(
    id: number,
    updateWordSenseDto: UpdateWordSenseDto,
  ): Promise<WordSense> {
    const wordSense = await this.findById(id);

    // If updating sense number, check for conflicts
    if (
      updateWordSenseDto.senseNumber &&
      updateWordSenseDto.senseNumber !== wordSense.senseNumber
    ) {
      const existingWordSense = await this.wordSensesRepository.findOne({
        where: {
          wordId: wordSense.wordId,
          senseNumber: updateWordSenseDto.senseNumber,
        },
      });
      if (existingWordSense) {
        throw new BadRequestException(
          'Word sense with this sense number already exists for this word',
        );
      }
    }

    Object.assign(wordSense, updateWordSenseDto);
    return this.wordSensesRepository.save(wordSense);
  }

  // Delete word sense
  async remove(id: number): Promise<void> {
    const wordSense = await this.findById(id);
    await this.wordSensesRepository.remove(wordSense);
  }

  // Get word sense statistics
  async getWordSenseStats() {
    const total = await this.wordSensesRepository.count();
    const primary = await this.wordSensesRepository.count({
      where: { isPrimary: true },
    });

    const hskLevelDistribution = await this.wordSensesRepository
      .createQueryBuilder('wordSense')
      .select('wordSense.hskLevel', 'level')
      .addSelect('COUNT(*)', 'total')
      .where('wordSense.hskLevel IS NOT NULL')
      .groupBy('wordSense.hskLevel')
      .orderBy('wordSense.hskLevel')
      .getRawMany();

    const partOfSpeechDistribution = await this.wordSensesRepository
      .createQueryBuilder('wordSense')
      .select('wordSense.partOfSpeech', 'pos')
      .addSelect('COUNT(*)', 'total')
      .where('wordSense.partOfSpeech IS NOT NULL')
      .groupBy('wordSense.partOfSpeech')
      .orderBy('total', 'DESC')
      .getRawMany();

    return {
      total,
      primary,
      hskLevelDistribution,
      partOfSpeechDistribution,
    };
  }
}
