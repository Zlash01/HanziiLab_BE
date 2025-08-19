import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { SentenceType } from '../enums/sentence-type.enum';

@Entity('sentences')
@Index(['sentenceType'])
export class Sentence {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'chinese_text',
    type: 'text',
    nullable: false,
  })
  chineseText: string;

  @Column({
    type: 'text',
    nullable: false,
  })
  pinyin: string;

  @Column({
    name: 'audio_url',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  audioUrl: string;

  @Column({
    name: 'sentence_type',
    type: 'enum',
    enum: SentenceType,
    nullable: false,
  })
  sentenceType: SentenceType;

  @Column({
    name: 'difficulty_level',
    type: 'int',
    nullable: false,
    comment: '1-5',
  })
  difficultyLevel: number;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
  })
  createdAt: Date;

  // Relations
  @OneToMany('SentenceTranslation', 'sentence')
  translations: any[];

  @OneToMany('SentenceToken', 'sentence')
  tokens: any[];
}
