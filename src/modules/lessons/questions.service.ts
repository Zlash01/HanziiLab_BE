import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from './entities/question.entity';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { OrderIndexService } from './order-index.service';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    private orderIndexService: OrderIndexService,
  ) {}

  async create(createQuestionDto: CreateQuestionDto): Promise<Question> {
    if (createQuestionDto.orderIndex === undefined || createQuestionDto.orderIndex === null) {
      createQuestionDto.orderIndex = await this.orderIndexService.getNextOrderIndex(createQuestionDto.lessonId);
    }

    const question = this.questionRepository.create(createQuestionDto);
    return await this.questionRepository.save(question);
  }

  async findAll(): Promise<Question[]> {
    return await this.questionRepository.find({
      where: { isActive: true },
      order: { orderIndex: 'ASC' },
    });
  }

  async findByLessonId(lessonId: number): Promise<Question[]> {
    return await this.questionRepository.find({
      where: { lessonId, isActive: true },
      order: { orderIndex: 'ASC' },
    });
  }

  async findOne(id: number, includeInactive: boolean = false): Promise<Question> {
    const whereClause: { id: number; isActive?: boolean } = { id };
    if (!includeInactive) {
      whereClause.isActive = true;
    }
    
    const question = await this.questionRepository.findOne({
      where: whereClause,
    });
    
    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }
    
    return question;
  }

  async update(id: number, updateQuestionDto: UpdateQuestionDto): Promise<Question> {
    const question = await this.findOne(id, true); // Include inactive for updates
    Object.assign(question, updateQuestionDto);
    return await this.questionRepository.save(question);
  }

  async remove(id: number): Promise<void> {
    const question = await this.findOne(id, true); // Include inactive for soft delete
    question.isActive = false;
    await this.questionRepository.save(question);
  }

  async hardDelete(id: number): Promise<void> {
    const result = await this.questionRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }
  }

  async restore(id: number): Promise<Question> {
    const question = await this.questionRepository.findOne({
      where: { id },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    question.isActive = true;
    return this.questionRepository.save(question);
  }
}