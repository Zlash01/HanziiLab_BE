import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { GrammarPattern } from './grammar-pattern.entity';

@Entity('grammar_translations')
@Index(['grammarPatternId', 'language'], { unique: true })
export class GrammarTranslation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'grammar_pattern_id', type: 'int' })
  grammarPatternId: number;

  @Column({ type: 'varchar', length: 5 })
  language: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  explanation: string;

  @Column({ name: 'when_to_use', type: 'text', nullable: true })
  whenToUse: string;

  @Column({ name: 'common_mistakes', type: 'text', nullable: true })
  commonMistakes: string;

  @ManyToOne('GrammarPattern', 'translations', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'grammar_pattern_id' })
  grammarPattern: GrammarPattern;
}
