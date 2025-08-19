import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { TokenType } from '../enums/token-type.enum';

@Entity('sentence_tokens')
@Index(['sentenceId', 'position'], { unique: true })
@Index(['tokenType'])
export class SentenceToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'sentence_id',
    type: 'int',
    nullable: false,
  })
  sentenceId: number;

  @Column({
    type: 'int',
    nullable: false,
  })
  position: number;

  @Column({
    name: 'chinese_text',
    type: 'varchar',
    length: 50,
    nullable: false,
  })
  chineseText: string;

  @Column({
    name: 'token_type',
    type: 'enum',
    enum: TokenType,
    nullable: false,
  })
  tokenType: TokenType;

  @Column({
    name: 'reference_id',
    type: 'int',
    nullable: true,
    comment: 'ID from word_senses OR grammar_patterns based on token_type',
  })
  referenceId: number;

  @Column({
    name: 'is_clickable',
    type: 'boolean',
    default: true,
  })
  isClickable: boolean;

  @Column({
    name: 'highlight_color',
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'For grammar patterns',
  })
  highlightColor: string;

  // Relations
  @ManyToOne('Sentence', 'tokens', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sentence_id' })
  sentence: any;
}
