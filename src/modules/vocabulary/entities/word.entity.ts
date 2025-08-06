// import {
//   Entity,
//   Column,
//   PrimaryGeneratedColumn,
//   CreateDateColumn,
//   OneToMany,
//   Index,
// } from 'typeorm';
// import { WordSense } from './word-sense.entity';

// @Entity('words')
// @Index(['simplified'])
// @Index(['traditional'])
// export class Word {
//   @PrimaryGeneratedColumn()
//   id: number;

//   @Column({
//     type: 'varchar',
//     length: 50,
//     charset: 'utf8mb4',
//     collation: 'utf8mb4_unicode_ci',
//   })
//   simplified: string;

//   @Column({
//     type: 'varchar',
//     length: 50,
//     nullable: true,
//     charset: 'utf8mb4',
//     collation: 'utf8mb4_unicode_ci',
//   })
//   traditional: string;

//   @Column({ name: 'is_compound', type: 'boolean', default: false })
//   isCompound: boolean;

//   @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
//   createdAt: Date;

//   Relations;
//   @OneToMany(() => WordSense, (sense) => sense.word)
//   senses: WordSense[];
// }
