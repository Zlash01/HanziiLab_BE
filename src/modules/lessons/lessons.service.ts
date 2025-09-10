import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Lessons } from './entities/lesson.entities';
import { LessonWord } from './entities/lesson-word.entity';
import { LessonGrammarPattern } from './entities/lesson-grammar-pattern.entity';
import { WordSense } from '../words/entities/word-sense.entity';
import { GrammarPattern } from '../grammar/entities/grammar-pattern.entity';
import { Courses } from '../courses/entities/course.entities';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import { Repository, In, DataSource, Not } from 'typeorm';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { GetLessonsQueryDto } from './dto/get-lessons-query.dto';
import { CreateLessonWordDto } from './dto/lesson-word.dto';
import { CreateLessonGrammarPatternDto } from './dto/lesson-grammar-pattern.dto';
import {
  CreateLessonItemDto,
  LessonItemType,
} from './dto/create-lesson-item.dto';
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
    @InjectRepository(WordSense)
    private wordSenseRepository: Repository<WordSense>,
    @InjectRepository(GrammarPattern)
    private grammarPatternRepository: Repository<GrammarPattern>,
    @InjectRepository(Courses)
    private courseRepository: Repository<Courses>,
    private contentService: ContentService,
    private questionsService: QuestionsService,
    private dataSource: DataSource,
  ) {}

  async createLesson(createLessonDto: CreateLessonDto): Promise<Lessons> {
    const {
      words,
      grammarPatterns,
      ...lessonData
    }: {
      words?: CreateLessonWordDto[];
      grammarPatterns?: CreateLessonGrammarPatternDto[];
    } & Omit<CreateLessonDto, 'words' | 'grammarPatterns'> = createLessonDto;

    // Auto-increment orderIndex within course if not provided
    if (!lessonData.orderIndex) {
      const maxOrderIndex: { maxOrder: number | null } | undefined =
        await this.lessonsRepository
          .createQueryBuilder('lesson')
          .select('MAX(lesson.orderIndex)', 'maxOrder')
          .where('lesson.courseId = :courseId', {
            courseId: lessonData.courseId,
          })
          .getRawOne();

      lessonData.orderIndex = (maxOrderIndex?.maxOrder || 0) + 1;
    }

    const lesson = this.lessonsRepository.create(lessonData);
    const savedLesson = await this.lessonsRepository.save(lesson);

    if (words && words.length > 0) {
      const lessonWords = words.map((word) =>
        this.lessonWordRepository.create({
          ...word,
          lessonId: savedLesson.id,
        }),
      );
      await this.lessonWordRepository.save(lessonWords);
    }

    if (grammarPatterns && grammarPatterns.length > 0) {
      const lessonGrammarPatterns = grammarPatterns.map((pattern) =>
        this.lessonGrammarPatternRepository.create({
          ...pattern,
          lessonId: savedLesson.id,
        }),
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
      .leftJoinAndSelect(
        'lesson.lessonGrammarPatterns',
        'lessonGrammarPatterns',
      )
      .leftJoinAndSelect(
        'lessonGrammarPatterns.grammarPattern',
        'grammarPattern',
      )
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
      .leftJoinAndSelect(
        'lesson.lessonGrammarPatterns',
        'lessonGrammarPatterns',
      )
      .leftJoinAndSelect(
        'lessonGrammarPatterns.grammarPattern',
        'grammarPattern',
      )
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

    // Validate courseId if it's being updated
    if (lessonData.courseId && lessonData.courseId !== lesson.courseId) {
      const course = await this.courseRepository.findOne({
        where: { id: lessonData.courseId, isActive: true },
      });
      if (!course) {
        throw new BadRequestException(
          `Course with ID ${lessonData.courseId} not found or inactive`,
        );
      }
    }

    // Check if orderIndex conflicts (if being updated and for the correct course)
    if (
      lessonData.orderIndex &&
      (lessonData.orderIndex !== lesson.orderIndex ||
        (lessonData.courseId && lessonData.courseId !== lesson.courseId))
    ) {
      const targetCourseId = lessonData.courseId || lesson.courseId;
      const existingLesson = await this.lessonsRepository.findOne({
        where: {
          courseId: targetCourseId,
          orderIndex: lessonData.orderIndex,
          id: Not(id),
        },
      });
      if (existingLesson) {
        throw new BadRequestException(
          `Order index ${lessonData.orderIndex} already exists for this course`,
        );
      }
    }

    return await this.dataSource.transaction(async (manager) => {
      // Update lesson data
      Object.assign(lesson, lessonData);
      const updatedLesson = await manager.save(lesson);

      if (words !== undefined) {
        // Remove existing words
        await manager.delete(LessonWord, { lessonId: id });

        if (words.length > 0) {
          // Validate word sense IDs
          const wordSenseIds = words.map((w) => w.wordSenseId);
          const validWordSenseCount = await manager
            .getRepository(WordSense)
            .count({
              where: { id: In(wordSenseIds) },
            });

          if (validWordSenseCount !== wordSenseIds.length) {
            const existingWordSenses = await manager
              .getRepository(WordSense)
              .find({
                where: { id: In(wordSenseIds) },
                select: ['id'],
              });
            const foundIds = existingWordSenses.map((ws) => ws.id);
            const missingIds = wordSenseIds.filter(
              (id) => !foundIds.includes(id),
            );
            throw new BadRequestException(
              `WordSense IDs not found: ${missingIds.join(', ')}`,
            );
          }

          const lessonWords = words.map((word) =>
            manager.create(LessonWord, {
              ...word,
              lessonId: id,
            }),
          );
          await manager.save(lessonWords);
        }
      }

      if (grammarPatterns !== undefined) {
        // Remove existing grammar patterns
        await manager.delete(LessonGrammarPattern, { lessonId: id });

        if (grammarPatterns.length > 0) {
          // Validate grammar pattern IDs
          const grammarPatternIds = grammarPatterns.map(
            (gp) => gp.grammarPatternId,
          );
          const validGrammarPatternCount = await manager
            .getRepository(GrammarPattern)
            .count({
              where: { id: In(grammarPatternIds) },
            });

          if (validGrammarPatternCount !== grammarPatternIds.length) {
            const existingGrammarPatterns = await manager
              .getRepository(GrammarPattern)
              .find({
                where: { id: In(grammarPatternIds) },
                select: ['id'],
              });
            const foundIds = existingGrammarPatterns.map((gp) => gp.id);
            const missingIds = grammarPatternIds.filter(
              (id) => !foundIds.includes(id),
            );
            throw new BadRequestException(
              `GrammarPattern IDs not found: ${missingIds.join(', ')}`,
            );
          }

          const lessonGrammarPatterns = grammarPatterns.map((pattern) =>
            manager.create(LessonGrammarPattern, {
              ...pattern,
              lessonId: id,
            }),
          );
          await manager.save(lessonGrammarPatterns);
        }
      }

      return updatedLesson;
    });
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
      ...content.map((c) => ({
        order_index: c.orderIndex,
        type: c.type,
        ...c.data,
      })),
      ...questions.map((q) => ({
        order_index: q.orderIndex,
        type: q.questionType,
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
  async addWordsToLesson(
    lessonId: number,
    words: CreateLessonWordDto[],
  ): Promise<LessonWord[]> {
    // Check if lesson exists
    const lesson = await this.findOne(lessonId, true);
    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    // Validate word sense IDs
    if (words && words.length > 0) {
      const wordSenseIds = words.map((w) => w.wordSenseId);
      const validWordSenseCount = await this.wordSenseRepository.count({
        where: { id: In(wordSenseIds) },
      });

      if (validWordSenseCount !== wordSenseIds.length) {
        // Find which IDs are missing for detailed error message
        const existingWordSenses = await this.wordSenseRepository.find({
          where: { id: In(wordSenseIds) },
          select: ['id'],
        });
        const foundIds = existingWordSenses.map((ws) => ws.id);
        const missingIds = wordSenseIds.filter((id) => !foundIds.includes(id));
        throw new BadRequestException(
          `WordSense IDs not found: ${missingIds.join(', ')}`,
        );
      }

      // Check for duplicate assignments
      const existingAssignments = await this.lessonWordRepository.find({
        where: {
          lessonId,
          wordSenseId: In(wordSenseIds),
        },
      });

      if (existingAssignments.length > 0) {
        const duplicateIds = existingAssignments.map((ea) => ea.wordSenseId);
        throw new BadRequestException(
          `WordSense IDs already assigned to this lesson: ${duplicateIds.join(', ')}`,
        );
      }
    }

    const lessonWords = words.map((word) =>
      this.lessonWordRepository.create({
        ...word,
        lessonId,
      }),
    );
    return this.lessonWordRepository.save(lessonWords);
  }

  async removeWordsFromLesson(
    lessonId: number,
    wordSenseIds: number[],
  ): Promise<void> {
    // Check if lesson exists
    const lesson = await this.findOne(lessonId, true);
    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    // Check if the words are actually assigned to this lesson
    const existingAssignments = await this.lessonWordRepository.find({
      where: {
        lessonId,
        wordSenseId: In(wordSenseIds),
      },
    });

    if (existingAssignments.length !== wordSenseIds.length) {
      const foundIds = existingAssignments.map((ea) => ea.wordSenseId);
      const missingIds = wordSenseIds.filter((id) => !foundIds.includes(id));
      throw new BadRequestException(
        `WordSense IDs not assigned to this lesson: ${missingIds.join(', ')}`,
      );
    }

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
  async addGrammarPatternsToLesson(
    lessonId: number,
    patterns: CreateLessonGrammarPatternDto[],
  ): Promise<LessonGrammarPattern[]> {
    // Check if lesson exists
    const lesson = await this.findOne(lessonId, true);
    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    // Validate grammar pattern IDs
    if (patterns && patterns.length > 0) {
      const grammarPatternIds = patterns.map((p) => p.grammarPatternId);
      const validGrammarPatternCount =
        await this.grammarPatternRepository.count({
          where: { id: In(grammarPatternIds) },
        });

      if (validGrammarPatternCount !== grammarPatternIds.length) {
        // Find which IDs are missing for detailed error message
        const existingGrammarPatterns =
          await this.grammarPatternRepository.find({
            where: { id: In(grammarPatternIds) },
            select: ['id'],
          });
        const foundIds = existingGrammarPatterns.map((gp) => gp.id);
        const missingIds = grammarPatternIds.filter(
          (id) => !foundIds.includes(id),
        );
        throw new BadRequestException(
          `GrammarPattern IDs not found: ${missingIds.join(', ')}`,
        );
      }

      // Check for duplicate assignments
      const existingAssignments =
        await this.lessonGrammarPatternRepository.find({
          where: {
            lessonId,
            grammarPatternId: In(grammarPatternIds),
          },
        });

      if (existingAssignments.length > 0) {
        const duplicateIds = existingAssignments.map(
          (ea) => ea.grammarPatternId,
        );
        throw new BadRequestException(
          `GrammarPattern IDs already assigned to this lesson: ${duplicateIds.join(', ')}`,
        );
      }
    }

    const lessonGrammarPatterns = patterns.map((pattern) =>
      this.lessonGrammarPatternRepository.create({
        ...pattern,
        lessonId,
      }),
    );
    return this.lessonGrammarPatternRepository.save(lessonGrammarPatterns);
  }

  async removeGrammarPatternsFromLesson(
    lessonId: number,
    grammarPatternIds: number[],
  ): Promise<void> {
    // Check if lesson exists
    const lesson = await this.findOne(lessonId, true);
    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    // Check if the grammar patterns are actually assigned to this lesson
    const existingAssignments = await this.lessonGrammarPatternRepository.find({
      where: {
        lessonId,
        grammarPatternId: In(grammarPatternIds),
      },
    });

    if (existingAssignments.length !== grammarPatternIds.length) {
      const foundIds = existingAssignments.map((ea) => ea.grammarPatternId);
      const missingIds = grammarPatternIds.filter(
        (id) => !foundIds.includes(id),
      );
      throw new BadRequestException(
        `GrammarPattern IDs not assigned to this lesson: ${missingIds.join(', ')}`,
      );
    }

    await this.lessonGrammarPatternRepository.delete({
      lessonId,
      grammarPatternId: In(grammarPatternIds),
    });
  }

  async getLessonGrammarPatterns(
    lessonId: number,
  ): Promise<LessonGrammarPattern[]> {
    return this.lessonGrammarPatternRepository.find({
      where: { lessonId },
      relations: ['grammarPattern'],
      order: { orderIndex: 'ASC' },
    });
  }

  async createLessonItem(
    createLessonItemDto: CreateLessonItemDto,
  ): Promise<any> {
    const { itemType, contentType, questionType, ...commonData } =
      createLessonItemDto;

    if (itemType === LessonItemType.CONTENT) {
      if (!contentType) {
        throw new BadRequestException(
          'contentType is required when itemType is "content"',
        );
      }

      return this.contentService.create({
        ...commonData,
        type: contentType,
      });
    } else if (itemType === LessonItemType.QUESTION) {
      if (!questionType) {
        throw new BadRequestException(
          'questionType is required when itemType is "question"',
        );
      }

      return this.questionsService.create({
        ...commonData,
        questionType: questionType,
      });
    } else {
      throw new BadRequestException(
        'Invalid itemType. Must be "content" or "question"',
      );
    }
  }
}
