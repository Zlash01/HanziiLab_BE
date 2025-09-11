import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum SourceType {
  WORD = 'word',
  GRAMMAR = 'grammar',
  CONTENT = 'content',
  QUESTION = 'question',
}

@Entity('embeddings')
@Index(['sourceType', 'sourceId'])
@Index(['sourceType'])
export class Embedding {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'source_type',
    type: 'enum',
    enum: SourceType,
    nullable: false,
    comment: 'Type of source content (word, grammar, content, question)',
  })
  sourceType: SourceType;

  @Column({
    name: 'source_id',
    type: 'int',
    nullable: false,
    comment: 'ID of the source entity',
  })
  sourceId: number;

  @Column({
    name: 'content_text',
    type: 'text',
    nullable: false,
    comment: 'Original text content that was embedded',
  })
  contentText: string;

  @Column({
    type: 'json',
    nullable: false,
    comment: 'Embedding vector (1024 dimensions for bge-m3)',
  })
  embedding: number[];

  @Column({
    type: 'json',
    nullable: true,
    comment: 'Additional metadata (HSK level, difficulty, etc.)',
  })
  metadata: Record<string, any>;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
    comment: 'Whether this embedding is active for search',
  })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}