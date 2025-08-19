import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SentenceTranslation } from './entities/sentence-translation.entity';
import { CreateSentenceTranslationDto } from './dto/create-sentence-translation.dto';
import { UpdateSentenceTranslationDto } from './dto/update-sentence-translation.dto';

@Injectable()
export class SentenceTranslationsService {
  constructor(
    @InjectRepository(SentenceTranslation)
    private readonly sentenceTranslationRepository: Repository<SentenceTranslation>,
  ) {}

  async create(
    createSentenceTranslationDto: CreateSentenceTranslationDto,
  ): Promise<SentenceTranslation> {
    const translation = this.sentenceTranslationRepository.create(
      createSentenceTranslationDto,
    );
    return await this.sentenceTranslationRepository.save(translation);
  }

  async findAll(): Promise<SentenceTranslation[]> {
    return await this.sentenceTranslationRepository.find({
      relations: ['sentence'],
    });
  }

  async findOne(id: number): Promise<SentenceTranslation> {
    const translation = await this.sentenceTranslationRepository.findOne({
      where: { id },
      relations: ['sentence'],
    });

    if (!translation) {
      throw new NotFoundException(
        `Sentence translation with ID ${id} not found`,
      );
    }

    return translation;
  }

  async findBySentenceId(sentenceId: number): Promise<SentenceTranslation[]> {
    return await this.sentenceTranslationRepository.find({
      where: { sentenceId },
      relations: ['sentence'],
    });
  }

  async findBySentenceAndLanguage(
    sentenceId: number,
    language: string,
  ): Promise<SentenceTranslation | null> {
    return await this.sentenceTranslationRepository.findOne({
      where: { sentenceId, language },
      relations: ['sentence'],
    });
  }

  async update(
    id: number,
    updateSentenceTranslationDto: UpdateSentenceTranslationDto,
  ): Promise<SentenceTranslation> {
    const translation = await this.findOne(id);

    Object.assign(translation, updateSentenceTranslationDto);

    return await this.sentenceTranslationRepository.save(translation);
  }

  async remove(id: number): Promise<void> {
    const translation = await this.findOne(id);
    await this.sentenceTranslationRepository.remove(translation);
  }

  async removeAllBySentenceId(sentenceId: number): Promise<void> {
    await this.sentenceTranslationRepository.delete({ sentenceId });
  }
}
