import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { WordSense } from './word-sense.entity';

@Entity('words')
@Index(['simplified'], { unique: true })
export class Word {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    comment: '好, 打, 中文',
  })
  simplified: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: '好, 打, 中文',
  })
  traditional: string;

  @Column({
    name: 'is_compound',
    type: 'boolean',
    default: false,
    comment: 'true if multiple characters like 中文',
  })
  isCompound: boolean;

  @Column({
    name: 'character_count',
    type: 'int',
    nullable: false,
    comment: 'How many characters',
  })
  characterCount: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  // Relations
  @OneToMany('WordSense', 'word')
  senses: WordSense[];
}
