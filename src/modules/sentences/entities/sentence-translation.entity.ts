import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

@Entity('sentence_translations')
@Index(['sentenceId', 'language'], { unique: true })
export class SentenceTranslation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'sentence_id',
    type: 'int',
    nullable: false,
  })
  sentenceId: number;

  @Column({
    type: 'varchar',
    length: 5,
    nullable: false,
  })
  language: string;

  @Column({
    type: 'text',
    nullable: false,
  })
  translation: string;

  @Column({
    name: 'literal_translation',
    type: 'text',
    nullable: true,
    comment: 'Word-by-word translation',
  })
  literalTranslation: string;

  // Relations
  @ManyToOne('Sentence', 'translations', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sentence_id' })
  sentence: any;
}
