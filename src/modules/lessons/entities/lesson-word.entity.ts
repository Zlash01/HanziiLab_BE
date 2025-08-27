import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Lessons } from './lesson.entities';
import { WordSense } from '../../words/entities/word-sense.entity';

@Entity('lesson_words')
@Index(['lessonId', 'wordSenseId'], { unique: true })
@Index(['lessonId', 'orderIndex'])
export class LessonWord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'lesson_id', type: 'int', nullable: false })
  lessonId: number;

  @Column({ name: 'word_sense_id', type: 'int', nullable: false })
  wordSenseId: number;

  @Column({
    name: 'is_primary',
    type: 'boolean',
    default: false,
    comment: 'True if this is a focus word for the lesson',
  })
  isPrimary: boolean;

  @Column({
    name: 'order_index',
    type: 'int',
    nullable: false,
    comment: 'Order in which words appear in the lesson',
  })
  orderIndex: number;

  // Relations
  @ManyToOne(() => Lessons, (lesson) => lesson.lessonWords, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'lesson_id' })
  lesson: Lessons;

  @ManyToOne(() => WordSense, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'word_sense_id' })
  wordSense: WordSense;
}