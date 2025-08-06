import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { HskLevel } from '../enums/hsk-level.enum';

@Entity('courses')
@Index(['hskLevel'])
@Index(['orderIndex'])
export class Courses {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'hsk_level',
    type: 'enum',
    enum: HskLevel,
    nullable: false,
    comment: '1-9 for HSK levels',
  })
  hskLevel: HskLevel;

  @Column({ type: 'varchar', length: 200, nullable: false })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'total_lessons', type: 'int', default: 0 })
  totalLessons: number;

  @Column({
    name: 'prerequisite_course_id',
    type: 'int',
    nullable: true,
    comment: 'Must complete this first',
  })
  prerequisiteCourseId: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'order_index', type: 'int', nullable: false })
  orderIndex: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  // Self-referencing relation for prerequisite course
  @ManyToOne(() => Courses, { nullable: true })
  @JoinColumn({ name: 'prerequisite_course_id' })
  prerequisiteCourse: Courses;
}
