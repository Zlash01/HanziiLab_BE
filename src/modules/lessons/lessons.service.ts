import { Injectable, NotFoundException } from '@nestjs/common';
import { Lessons } from './entities/lesson.entities';
import { LessonWord } from './entities/lesson-word.entity';
import { LessonGrammarPattern } from './entities/lesson-grammar-pattern.entity';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import { Repository, In } from 'typeorm';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { GetLessonsQueryDto } from './dto/get-lessons-query.dto';
import { ContentService } from './content.service';
import { QuestionsService } from './questions.service';

@Injectable()
export class LessonsService {
  constructor(
    @InjectRepository(Lessons)
    private lessonsRepository: Repository<Lessons>,
    @InjectRepository(LessonWord)
    private lessonWordRepository: Repository<LessonWord>,
    @InjectRepository(LessonGrammarPattern)
    private lessonGrammarPatternRepository: Repository<LessonGrammarPattern>,
    private contentService: ContentService,
    private questionsService: QuestionsService,
  ) {}

  async createLesson(createLessonDto: CreateLessonDto): Promise<Lessons> {
    const { words, grammarPatterns, ...lessonData } = createLessonDto;
    
    const lesson = this.lessonsRepository.create(lessonData);
    const savedLesson = await this.lessonsRepository.save(lesson);

    if (words && words.length > 0) {
      const lessonWords = words.map(word => 
        this.lessonWordRepository.create({
          ...word,
          lessonId: savedLesson.id,
        })
      );
      await this.lessonWordRepository.save(lessonWords);
    }

    if (grammarPatterns && grammarPatterns.length > 0) {
      const lessonGrammarPatterns = grammarPatterns.map(pattern => 
        this.lessonGrammarPatternRepository.create({
          ...pattern,
          lessonId: savedLesson.id,
        })
      );
      await this.lessonGrammarPatternRepository.save(lessonGrammarPatterns);
    }

    return this.findOne(savedLesson.id, true);
  }

  async findAll(query: GetLessonsQueryDto): Promise<{
    data: Lessons[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      page = 1,
      limit = 10,
      courseId,
      isActive,
      includeInactive = false,
    } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.lessonsRepository
      .createQueryBuilder('lesson')
      .leftJoinAndSelect('lesson.course', 'course')
      .leftJoinAndSelect('lesson.lessonWords', 'lessonWords')
      .leftJoinAndSelect('lessonWords.wordSense', 'wordSense')
      .leftJoinAndSelect('wordSense.word', 'word')
      .leftJoinAndSelect('lesson.lessonGrammarPatterns', 'lessonGrammarPatterns')
      .leftJoinAndSelect('lessonGrammarPatterns.grammarPattern', 'grammarPattern')
      .orderBy('lesson.orderIndex', 'ASC')
      .addOrderBy('lessonWords.orderIndex', 'ASC')
      .addOrderBy('lessonGrammarPatterns.orderIndex', 'ASC');

    if (courseId) {
      queryBuilder.andWhere('lesson.courseId = :courseId', { courseId });
    }

    // Handle isActive filter logic
    if (isActive !== undefined) {
      queryBuilder.andWhere('lesson.isActive = :isActive', { isActive });
    } else if (!includeInactive) {
      // By default, only show active lessons unless includeInactive is true
      queryBuilder.andWhere('lesson.isActive = :isActive', { isActive: true });
    }

    const [data, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(
    id: number,
    includeInactive: boolean = false,
  ): Promise<Lessons> {
    const queryBuilder = this.lessonsRepository
      .createQueryBuilder('lesson')
      .leftJoinAndSelect('lesson.course', 'course')
      .leftJoinAndSelect('lesson.lessonWords', 'lessonWords')
      .leftJoinAndSelect('lessonWords.wordSense', 'wordSense')
      .leftJoinAndSelect('wordSense.word', 'word')
      .leftJoinAndSelect('lesson.lessonGrammarPatterns', 'lessonGrammarPatterns')
      .leftJoinAndSelect('lessonGrammarPatterns.grammarPattern', 'grammarPattern')
      .where('lesson.id = :id', { id })
      .orderBy('lessonWords.orderIndex', 'ASC')
      .addOrderBy('lessonGrammarPatterns.orderIndex', 'ASC');

    if (!includeInactive) {
      queryBuilder.andWhere('lesson.isActive = :isActive', { isActive: true });
    }

    const lesson = await queryBuilder.getOne();

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${id} not found`);
    }

    return lesson;
  }

  async update(id: number, updateLessonDto: UpdateLessonDto): Promise<Lessons> {
    const { words, grammarPatterns, ...lessonData } = updateLessonDto;
    const lesson = await this.findOne(id, true); // Include inactive lessons for updates
    
    Object.assign(lesson, lessonData);
    const updatedLesson = await this.lessonsRepository.save(lesson);

    if (words !== undefined) {
      // Remove existing words and add new ones
      await this.lessonWordRepository.delete({ lessonId: id });
      
      if (words.length > 0) {
        const lessonWords = words.map(word => 
          this.lessonWordRepository.create({
            ...word,
            lessonId: id,
          })
        );
        await this.lessonWordRepository.save(lessonWords);
      }
    }

    if (grammarPatterns !== undefined) {
      // Remove existing grammar patterns and add new ones
      await this.lessonGrammarPatternRepository.delete({ lessonId: id });
      
      if (grammarPatterns.length > 0) {
        const lessonGrammarPatterns = grammarPatterns.map(pattern => 
          this.lessonGrammarPatternRepository.create({
            ...pattern,
            lessonId: id,
          })
        );
        await this.lessonGrammarPatternRepository.save(lessonGrammarPatterns);
      }
    }

    return this.findOne(id, true);
  }

  async softDelete(id: number): Promise<Lessons> {
    const lesson = await this.findOne(id, true); // Include inactive lessons for soft delete
    lesson.isActive = false;
    return this.lessonsRepository.save(lesson);
  }

  async hardDelete(id: number): Promise<void> {
    const lesson = await this.findOne(id, true); // Include inactive lessons for hard delete
    await this.lessonsRepository.remove(lesson);
  }

  async restore(id: number): Promise<Lessons> {
    const lesson = await this.lessonsRepository.findOne({
      where: { id },
      relations: ['course'],
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${id} not found`);
    }

    lesson.isActive = true;
    return this.lessonsRepository.save(lesson);
  }

  async findByCourseId(courseId: number): Promise<Lessons[]> {
    return this.lessonsRepository.find({
      where: { courseId, isActive: true },
      relations: ['course'],
      order: { orderIndex: 'ASC' },
    });
  }

  async findByCourseIdIncludeInactive(courseId: number): Promise<Lessons[]> {
    return this.lessonsRepository.find({
      where: { courseId },
      relations: ['course'],
      order: { orderIndex: 'ASC' },
    });
  }

  async findCompleteLesson(id: number): Promise<any> {
    const lesson = await this.findOne(id);
    
    const [content, questions] = await Promise.all([
      this.contentService.findByLessonId(id),
      this.questionsService.findByLessonId(id),
    ]);

    // Combine content and questions into one array and sort by order_index
    const combinedContent = [
      ...content.map(c => ({
        order_index: c.orderIndex,
        question_type: c.type,
        ...c.data,
      })),
      ...questions.map(q => ({
        order_index: q.orderIndex,
        question_type: q.questionType,
        ...q.data,
      })),
    ].sort((a, b) => a.order_index - b.order_index);

    return {
      id: lesson.id,
      name: lesson.name,
      description: lesson.description,
      content: combinedContent,
    };
  }

  // Lesson Words Management
  async addWordsToLesson(lessonId: number, words: any[]): Promise<LessonWord[]> {
    const lessonWords = words.map(word => 
      this.lessonWordRepository.create({
        ...word,
        lessonId,
      })
    ).flat();
    return this.lessonWordRepository.save(lessonWords) as Promise<LessonWord[]>;
  }

  async removeWordsFromLesson(lessonId: number, wordSenseIds: number[]): Promise<void> {
    await this.lessonWordRepository.delete({
      lessonId,
      wordSenseId: In(wordSenseIds),
    });
  }

  async getLessonWords(lessonId: number): Promise<LessonWord[]> {
    return this.lessonWordRepository.find({
      where: { lessonId },
      relations: ['wordSense', 'wordSense.word'],
      order: { orderIndex: 'ASC' },
    });
  }

  // Lesson Grammar Patterns Management
  async addGrammarPatternsToLesson(lessonId: number, patterns: any[]): Promise<LessonGrammarPattern[]> {
    const lessonGrammarPatterns = patterns.map(pattern => 
      this.lessonGrammarPatternRepository.create({
        ...pattern,
        lessonId,
      })
    ).flat();
    return this.lessonGrammarPatternRepository.save(lessonGrammarPatterns) as Promise<LessonGrammarPattern[]>;
  }

  async removeGrammarPatternsFromLesson(lessonId: number, grammarPatternIds: number[]): Promise<void> {
    await this.lessonGrammarPatternRepository.delete({
      lessonId,
      grammarPatternId: In(grammarPatternIds),
    });
  }

  async getLessonGrammarPatterns(lessonId: number): Promise<LessonGrammarPattern[]> {
    return this.lessonGrammarPatternRepository.find({
      where: { lessonId },
      relations: ['grammarPattern'],
      order: { orderIndex: 'ASC' },
    });
  }
}
