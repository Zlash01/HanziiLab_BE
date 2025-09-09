import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Courses } from './entities/course.entities';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { GetCoursesQueryDto } from './dto/get-courses-query.dto';
import { HskLevel } from './enums/hsk-level.enum';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Courses)
    private coursesRepository: Repository<Courses>,
  ) {}

  // Create a new course
  async create(createCourseDto: CreateCourseDto): Promise<Courses> {
    // Check if prerequisite course exists (if provided)
    if (createCourseDto.prerequisiteCourseId) {
      const prerequisite = await this.findById(
        createCourseDto.prerequisiteCourseId,
      );
      if (!prerequisite) {
        throw new BadRequestException('Prerequisite course not found');
      }
    }

    // Auto-increment orderIndex if not provided
    if (!createCourseDto.orderIndex) {
      const maxOrderIndex = await this.coursesRepository
        .createQueryBuilder('course')
        .select('MAX(course.orderIndex)', 'maxOrder')
        .getRawOne();
      
      createCourseDto.orderIndex = (maxOrderIndex?.maxOrder || 0) + 1;
    } else {
      // Check if order index is already taken
      const existingCourse = await this.coursesRepository.findOne({
        where: { orderIndex: createCourseDto.orderIndex },
      });
      if (existingCourse) {
        throw new BadRequestException('Order index already exists');
      }
    }

    const course = this.coursesRepository.create(createCourseDto);
    return this.coursesRepository.save(course);
  }

  // Get all courses with pagination and filtering
  async findAll(
    query: GetCoursesQueryDto,
  ): Promise<{ courses: Courses[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      hskLevel,
      isActive,
      prerequisiteCourseId,
    } = query;
    const queryBuilder = this.coursesRepository
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.prerequisiteCourse', 'prerequisite');

    if (hskLevel) {
      queryBuilder.andWhere('course.hskLevel = :hskLevel', { hskLevel });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('course.isActive = :isActive', { isActive });
    }

    if (prerequisiteCourseId) {
      queryBuilder.andWhere(
        'course.prerequisiteCourseId = :prerequisiteCourseId',
        { prerequisiteCourseId },
      );
    }

    const [courses, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('course.hskLevel', 'ASC')
      .addOrderBy('course.orderIndex', 'ASC')
      .getManyAndCount();

    return { courses, total };
  }

  // Get course by ID
  async findById(id: number): Promise<Courses | null> {
    return this.coursesRepository.findOne({
      where: { id },
      relations: ['prerequisiteCourse'],
    });
  }

  // Update course
  async update(id: number, updateCourseDto: UpdateCourseDto): Promise<Courses> {
    const course = await this.findById(id);
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check if prerequisite course exists (if being updated)
    if (
      updateCourseDto.prerequisiteCourseId &&
      updateCourseDto.prerequisiteCourseId !== course.prerequisiteCourseId
    ) {
      if (updateCourseDto.prerequisiteCourseId === id) {
        throw new BadRequestException('Course cannot be its own prerequisite');
      }

      const prerequisite = await this.findById(
        updateCourseDto.prerequisiteCourseId,
      );
      if (!prerequisite) {
        throw new BadRequestException('Prerequisite course not found');
      }
    }

    // Check if order index is already taken (if being updated)
    if (
      updateCourseDto.orderIndex &&
      updateCourseDto.orderIndex !== course.orderIndex
    ) {
      const existingCourse = await this.coursesRepository.findOne({
        where: { orderIndex: updateCourseDto.orderIndex },
      });
      if (existingCourse && existingCourse.id !== id) {
        throw new BadRequestException('Order index already exists');
      }
    }

    Object.assign(course, updateCourseDto);
    return this.coursesRepository.save(course);
  }

  // Soft delete course
  async delete(id: number): Promise<void> {
    const course = await this.findById(id);
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check if course is a prerequisite for other courses
    const dependentCourses = await this.coursesRepository.find({
      where: { prerequisiteCourseId: id },
    });

    if (dependentCourses.length > 0) {
      throw new BadRequestException(
        'Cannot delete course that is a prerequisite for other courses',
      );
    }

    // Soft delete by setting isActive to false
    course.isActive = false;
    await this.coursesRepository.save(course);
  }

  // Hard delete course
  async hardDelete(id: number): Promise<void> {
    const course = await this.findById(id);
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check if course is a prerequisite for other courses
    const dependentCourses = await this.coursesRepository.find({
      where: { prerequisiteCourseId: id },
    });

    if (dependentCourses.length > 0) {
      throw new BadRequestException(
        'Cannot delete course that is a prerequisite for other courses',
      );
    }

    const result = await this.coursesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Course not found');
    }
  }

  // Restore course
  async restore(id: number): Promise<Courses> {
    const course = await this.findById(id);
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    course.isActive = true;
    return this.coursesRepository.save(course);
  }

  // Get courses by HSK level
  async findByHskLevel(hskLevel: HskLevel): Promise<Courses[]> {
    return this.coursesRepository.find({
      where: { hskLevel, isActive: true },
      relations: ['prerequisiteCourse'],
      order: { orderIndex: 'ASC' },
    });
  }

  // Get course statistics
  async getCourseStats(): Promise<{
    totalCourses: number;
    activeCourses: number;
    inactiveCourses: number;
    coursesByLevel: Record<HskLevel, number>;
  }> {
    const [totalCourses, activeCourses, inactiveCourses] = await Promise.all([
      this.coursesRepository.count(),
      this.coursesRepository.count({ where: { isActive: true } }),
      this.coursesRepository.count({ where: { isActive: false } }),
    ]);

    // Get courses count by HSK level
    const coursesByLevelData = await this.coursesRepository
      .createQueryBuilder('course')
      .select('course.hskLevel', 'level')
      .addSelect('COUNT(*)', 'count')
      .where('course.isActive = :isActive', { isActive: true })
      .groupBy('course.hskLevel')
      .getRawMany();

    const coursesByLevel = {} as Record<HskLevel, number>;
    Object.values(HskLevel).forEach((level) => {
      coursesByLevel[level] = 0;
    });

    coursesByLevelData.forEach((item: { level: HskLevel; count: string }) => {
      coursesByLevel[item.level] = parseInt(item.count, 10);
    });

    return {
      totalCourses,
      activeCourses,
      inactiveCourses,
      coursesByLevel,
    };
  }
}
