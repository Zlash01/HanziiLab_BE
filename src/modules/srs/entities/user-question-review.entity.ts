import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Question } from '../../lessons/entities/question.entity';
import { Lessons } from '../../lessons/entities/lesson.entities';

@Entity('user_question_reviews')
@Index(['userId', 'questionId'], { unique: true })
@Index(['userId', 'nextReviewDate'])
@Index(['userId', 'lessonId'])
export class UserQuestionReview {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', nullable: false })
  userId: number;

  @Column({ name: 'question_id', nullable: false })
  questionId: number;

  @Column({ name: 'lesson_id', nullable: false })
  lessonId: number;

  // SM-2 Algorithm Fields
  @Column({
    name: 'ease_factor',
    type: 'decimal',
    precision: 4,
    scale: 2,
    default: 2.5,
  })
  easeFactor: number;

  @Column({
    name: 'interval',
    type: 'int',
    default: 1,
    comment: 'Days until next review',
  })
  interval: number;

  @Column({
    name: 'repetitions',
    type: 'int',
    default: 0,
    comment: 'Consecutive correct answers',
  })
  repetitions: number;

  @Column({
    name: 'next_review_date',
    type: 'timestamp',
    nullable: false,
  })
  nextReviewDate: Date;

  @Column({
    name: 'last_reviewed_at',
    type: 'timestamp',
    nullable: true,
  })
  lastReviewedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Question, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @ManyToOne(() => Lessons, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lesson_id' })
  lesson: Lessons;
}
