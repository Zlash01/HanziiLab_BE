import { Exclude } from 'class-transformer';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  //   OneToMany,
  Index,
} from 'typeorm';
// import { UserVocabulary } from '../../vocabulary/entities/user-vocabulary.entity';
import { Role } from '../../../modules/auth/enums/role.enum';

@Entity('users')
@Index(['currentHskLevel'])
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.User, // <-- Every new user will be a 'user' by default
  })
  role: Role;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  @Exclude()
  passwordHash: string;

  @Column({
    name: 'display_name',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  displayName: string;

  @Column({ name: 'current_hsk_level', type: 'tinyint', default: 1 })
  currentHskLevel: number;

  @Column({
    name: 'native_language',
    type: 'varchar',
    length: 10,
    default: 'en',
  })
  nativeLanguage: string;

  @Column({ name: 'total_study_days', type: 'int', default: 0 })
  totalStudyDays: number;

  @Column({ name: 'current_streak', type: 'int', default: 0 })
  currentStreak: number;

  @Column({ name: 'longest_streak', type: 'int', default: 0 })
  longestStreak: number;

  @Column({ name: 'last_study_date', type: 'date', nullable: true })
  lastStudyDate: Date;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  //   // Relations
  //   @OneToMany(() => UserVocabulary, userVocab => userVocab.user)
  //   vocabularyProgress: UserVocabulary[];
}
