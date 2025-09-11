import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('rag_contexts')
export class RagContext {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', nullable: true })
  userId: number;

  @Column({
    type: 'text',
    nullable: false,
    comment: 'User query text',
  })
  query: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Generated response',
  })
  response: string;

  @Column({
    name: 'retrieved_sources',
    type: 'json',
    nullable: true,
    comment: 'Sources used for RAG response',
  })
  retrievedSources: Array<{
    sourceType: string;
    sourceId: number;
    similarity: number;
    content: string;
  }>;

  @Column({
    name: 'processing_time_ms',
    type: 'int',
    nullable: true,
    comment: 'Time taken to process the query',
  })
  processingTimeMs: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}