import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Courses } from 'src/modules/courses/entities/course.entities';
import { LessonWord } from './lesson-word.entity';
import { LessonGrammarPattern } from './lesson-grammar-pattern.entity';

@Entity('lessons')
export class Lessons {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 200, nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  //isActive
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  // autoincrement order index within the course
  @Column({ name: 'order_index', type: 'int', nullable: false })
  orderIndex: number;

  @Column({ name: 'courseId', nullable: false })
  courseId: number;

  @ManyToOne(() => Courses, (course) => course.lessons, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'courseId' })
  course: Courses;

  // Relations to words and grammar patterns
  @OneToMany(() => LessonWord, (lessonWord) => lessonWord.lesson, {
    cascade: true,
  })
  lessonWords: LessonWord[];

  @OneToMany(() => LessonGrammarPattern, (lessonGrammar) => lessonGrammar.lesson, {
    cascade: true,
  })
  lessonGrammarPatterns: LessonGrammarPattern[];
}
