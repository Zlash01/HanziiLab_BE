import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Lessons } from './lesson.entities';
import { ContentType } from '../enums/content-type.enum';

@Entity('contents')
export class Content {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'lesson_id', nullable: false })
  lessonId: number;

  @Column({ name: 'order_index', type: 'int', nullable: false })
  orderIndex: number;

  @Column({
    type: 'enum',
    enum: ContentType,
    nullable: false,
  })
  type: ContentType;

  @Column({ type: 'json', nullable: false })
  data: Record<string, any>; // JSON field for flexible content data

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @ManyToOne(() => Lessons, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lesson_id' })
  lesson: Lessons;
}