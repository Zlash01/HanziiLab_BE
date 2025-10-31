import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WordSense } from './word-sense.entity';

@Entity('word_sense_translations')
@Index(['wordSenseId', 'language'], { unique: true })
export class WordSenseTranslation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'word_sense_id', type: 'int', nullable: false })
  wordSenseId: number;

  @Column({
    type: 'varchar',
    length: 5,
    nullable: false,
    default: 'vn',
    comment: 'en, vn, th, etc.',
  })
  language: string;

  @Column({
    type: 'text',
    nullable: false,
    comment: 'to hit, to play, etc.',
  })
  translation: string;

  @Column({
    name: 'additional_detail',
    type: 'text',
    nullable: true,
    comment: 'Extra explanation or context',
  })
  additionalDetail: string;

  // Relations
  @ManyToOne('WordSense', 'translations', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'word_sense_id' })
  wordSense: WordSense;
}
