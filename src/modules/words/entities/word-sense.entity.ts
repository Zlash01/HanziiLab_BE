import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Word } from './word.entity';
import { WordSenseTranslation } from './word-sense-translation.entity';

@Entity('word_senses')
@Index(['wordId', 'senseNumber'], { unique: true })
@Index(['hskLevel'])
export class WordSense {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'word_id', type: 'int', nullable: false })
  wordId: number;

  @Column({
    name: 'sense_number',
    type: 'int',
    nullable: false,
    comment: 'Meaning #1, #2, etc.',
  })
  senseNumber: number;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: 'dǎ',
  })
  pinyin: string;

  @Column({
    name: 'part_of_speech',
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'verb, noun, etc.',
  })
  partOfSpeech: string;

  @Column({
    name: 'hsk_level',
    type: 'int',
    nullable: true,
    comment: 'When students learn this',
  })
  hskLevel: number;

  @Column({
    name: 'is_primary',
    type: 'boolean',
    default: false,
    comment: 'Most common meaning?',
  })
  isPrimary: boolean;

  @Column({
    name: 'image_url',
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'URL to image resource',
  })
  imageUrl: string;

  @Column({
    name: 'audio_url',
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'URL to audio resource',
  })
  audioUrl: string;

  // Relations
  @ManyToOne('Word', 'senses', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'word_id' })
  word: Word;

  @OneToMany('WordSenseTranslation', 'wordSense')
  translations: WordSenseTranslation[];
}
