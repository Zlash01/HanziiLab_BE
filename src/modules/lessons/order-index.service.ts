import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Content } from './entities/content.entity';
import { Question } from './entities/question.entity';

@Injectable()
export class OrderIndexService {
  constructor(
    @InjectRepository(Content)
    private contentRepository: Repository<Content>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
  ) {}

  async getNextOrderIndex(lessonId: number): Promise<number> {
    const [maxContentIndex, maxQuestionIndex] = await Promise.all([
      this.getMaxContentOrderIndex(lessonId),
      this.getMaxQuestionOrderIndex(lessonId),
    ]);

    return Math.max(maxContentIndex || 0, maxQuestionIndex || 0) + 1;
  }

  private async getMaxContentOrderIndex(lessonId: number): Promise<number> {
    const result = await this.contentRepository
      .createQueryBuilder('content')
      .select('MAX(content.orderIndex)', 'maxIndex')
      .where('content.lessonId = :lessonId', { lessonId })
      .andWhere('content.isActive = :isActive', { isActive: true })
      .getRawOne<{ maxIndex: number | null }>();

    return result?.maxIndex ?? 0;
  }

  private async getMaxQuestionOrderIndex(lessonId: number): Promise<number> {
    const result = await this.questionRepository
      .createQueryBuilder('question')
      .select('MAX(question.orderIndex)', 'maxIndex')
      .where('question.lessonId = :lessonId', { lessonId })
      .andWhere('question.isActive = :isActive', { isActive: true })
      .getRawOne<{ maxIndex: number | null }>();

    return result?.maxIndex ?? 0;
  }
}