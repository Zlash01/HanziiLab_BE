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
@Index(['hskLevel'])
export class GrammarPattern {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'json' })
  pattern: string[];

  @Column({
    name: 'pattern_pinyin',
    type: 'json',
    nullable: true,
  })
  patternPinyin: string[];

  @Column({
    name: 'pattern_formula',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  patternFormula: string;

  @Column({ name: 'hsk_level', type: 'int', nullable: true })
  hskLevel: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany('GrammarTranslation', 'grammarPattern', {
    cascade: true,
    onDelete: 'CASCADE',
  })
  translations: GrammarTranslation[];
}
