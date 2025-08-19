import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sentence } from './entities/sentence.entity';
import { CreateSentenceDto } from './dto/create-sentence.dto';
import { UpdateSentenceDto } from './dto/update-sentence.dto';
import { GetSentencesQueryDto } from './dto/get-sentences-query.dto';

import { SentenceType } from './enums/sentence-type.enum';

@Injectable()
export class SentencesService {
  constructor(
    @InjectRepository(Sentence)
    private readonly sentenceRepository: Repository<Sentence>,
  ) {}

  async create(createSentenceDto: CreateSentenceDto): Promise<Sentence> {
    const sentence = this.sentenceRepository.create(createSentenceDto);
    return await this.sentenceRepository.save(sentence);
  }

  async findAll(query: GetSentencesQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sentenceType,
      difficultyLevel,
      hasAudio,
    } = query;

    const queryBuilder = this.sentenceRepository
      .createQueryBuilder('sentence')
      .leftJoinAndSelect('sentence.translations', 'translations')
      .leftJoinAndSelect('sentence.tokens', 'tokens')
      .orderBy('sentence.createdAt', 'DESC');

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(sentence.chineseText LIKE :search OR sentence.pinyin LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (sentenceType) {
      queryBuilder.andWhere('sentence.sentenceType = :sentenceType', {
        sentenceType,
      });
    }

    if (difficultyLevel) {
      queryBuilder.andWhere('sentence.difficultyLevel = :difficultyLevel', {
        difficultyLevel,
      });
    }

    if (hasAudio !== undefined) {
      if (hasAudio) {
        queryBuilder.andWhere('sentence.audioUrl IS NOT NULL');
      } else {
        queryBuilder.andWhere('sentence.audioUrl IS NULL');
      }
    }

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number): Promise<Sentence> {
    const sentence = await this.sentenceRepository.findOne({
      where: { id },
      relations: ['translations', 'tokens'],
    });

    if (!sentence) {
      throw new NotFoundException(`Sentence with ID ${id} not found`);
    }

    return sentence;
  }

  async update(
    id: number,
    updateSentenceDto: UpdateSentenceDto,
  ): Promise<Sentence> {
    const sentence = await this.findOne(id);

    Object.assign(sentence, updateSentenceDto);

    return await this.sentenceRepository.save(sentence);
  }

  async remove(id: number): Promise<void> {
    const sentence = await this.findOne(id);
    await this.sentenceRepository.remove(sentence);
  }

  async findByType(sentenceType: SentenceType): Promise<Sentence[]> {
    return await this.sentenceRepository.find({
      where: { sentenceType },
      relations: ['translations', 'tokens'],
    });
  }

  async findByDifficultyLevel(difficultyLevel: number): Promise<Sentence[]> {
    return await this.sentenceRepository.find({
      where: { difficultyLevel },
      relations: ['translations', 'tokens'],
    });
  }
}
