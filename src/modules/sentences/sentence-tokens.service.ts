import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SentenceToken } from './entities/sentence-token.entity';
import { CreateSentenceTokenDto } from './dto/create-sentence-token.dto';
import { UpdateSentenceTokenDto } from './dto/update-sentence-token.dto';

@Injectable()
export class SentenceTokensService {
  constructor(
    @InjectRepository(SentenceToken)
    private readonly sentenceTokenRepository: Repository<SentenceToken>,
  ) {}

  async create(
    createSentenceTokenDto: CreateSentenceTokenDto,
  ): Promise<SentenceToken> {
    const token = this.sentenceTokenRepository.create(createSentenceTokenDto);
    return await this.sentenceTokenRepository.save(token);
  }

  async createMany(
    createSentenceTokenDtos: CreateSentenceTokenDto[],
  ): Promise<SentenceToken[]> {
    const tokens = this.sentenceTokenRepository.create(createSentenceTokenDtos);
    return await this.sentenceTokenRepository.save(tokens);
  }

  async findAll(): Promise<SentenceToken[]> {
    return await this.sentenceTokenRepository.find({
      relations: ['sentence'],
      order: { sentenceId: 'ASC', position: 'ASC' },
    });
  }

  async findOne(id: number): Promise<SentenceToken> {
    const token = await this.sentenceTokenRepository.findOne({
      where: { id },
      relations: ['sentence'],
    });

    if (!token) {
      throw new NotFoundException(`Sentence token with ID ${id} not found`);
    }

    return token;
  }

  async findBySentenceId(sentenceId: number): Promise<SentenceToken[]> {
    return await this.sentenceTokenRepository.find({
      where: { sentenceId },
      relations: ['sentence'],
      order: { position: 'ASC' },
    });
  }

  async update(
    id: number,
    updateSentenceTokenDto: UpdateSentenceTokenDto,
  ): Promise<SentenceToken> {
    const token = await this.findOne(id);

    Object.assign(token, updateSentenceTokenDto);

    return await this.sentenceTokenRepository.save(token);
  }

  async remove(id: number): Promise<void> {
    const token = await this.findOne(id);
    await this.sentenceTokenRepository.remove(token);
  }

  async removeAllBySentenceId(sentenceId: number): Promise<void> {
    await this.sentenceTokenRepository.delete({ sentenceId });
  }

  async reorderTokens(
    sentenceId: number,
    tokenOrders: { id: number; position: number }[],
  ): Promise<SentenceToken[]> {
    const tokens = await this.findBySentenceId(sentenceId);

    for (const order of tokenOrders) {
      const token = tokens.find((t) => t.id === order.id);
      if (token) {
        token.position = order.position;
      }
    }

    return await this.sentenceTokenRepository.save(tokens);
  }
}
