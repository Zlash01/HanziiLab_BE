import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Lessons } from './lesson.entities';
import { GrammarPattern } from '../../grammar/entities/grammar-pattern.entity';

@Entity('lesson_grammar_patterns')
@Index(['lessonId', 'grammarPatternId'], { unique: true })
@Index(['lessonId', 'orderIndex'])
export class LessonGrammarPattern {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'lesson_id', type: 'int', nullable: false })
  lessonId: number;

  @Column({ name: 'grammar_pattern_id', type: 'int', nullable: false })
  grammarPatternId: number;

  @Column({
    name: 'order_index',
    type: 'int',
    nullable: false,
    comment: 'Order in which grammar patterns appear in the lesson',
  })
  orderIndex: number;

  // Relations
  @ManyToOne(() => Lessons, (lesson) => lesson.lessonGrammarPatterns, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'lesson_id' })
  lesson: Lessons;

  @ManyToOne(() => GrammarPattern, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'grammar_pattern_id' })
  grammarPattern: GrammarPattern;
}