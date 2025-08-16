import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { GrammarTranslation } from './grammar-translation.entity';

@Entity('grammar_patterns')
@Index(['pattern'])
@Index(['hskLevel'])
export class GrammarPattern {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 200 })
  pattern: string;

  @Column({
    name: 'pattern_pinyin',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  patternPinyin: string;

  @Column({
    name: 'pattern_formula',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  patternFormula: string;

  @Column({ name: 'hsk_level', type: 'int', nullable: true })
  hskLevel: number;

  @Column({
    name: 'difficulty_level',
    type: 'int',
    nullable: true,
    comment: '1-5 scale',
  })
  difficultyLevel: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany('GrammarTranslation', 'grammarPattern', {
    cascade: true,
    onDelete: 'CASCADE',
  })
  translations: GrammarTranslation[];
}
