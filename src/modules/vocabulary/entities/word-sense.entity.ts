// import {
//   Entity,
//   Column,
//   PrimaryGeneratedColumn,
//   ManyToOne,
//   OneToMany,
//   Index,
//   JoinColumn,
// } from 'typeorm';
// import { Word } from './word.entity';
// import { WordSenseMeaning } from './word-sense-meaning.entity';

// @Entity('word_senses')
// @Index(['wordId', 'senseNumber'], { unique: true })
// @Index(['hskLevel'])
// @Index(['isPrimary'])
// export class WordSense {
//   @PrimaryGeneratedColumn()
//   id: number;

//   @Column({ name: 'word_id' })
//   wordId: number;

//   @Column({ name: 'sense_number', type: 'tinyint' })
//   senseNumber: number;

//   @Column({ type: 'varchar', length: 100 })
//   pinyin: string;

//   @Column({ name: 'tone_marks', type: 'varchar', length: 50, nullable: true })
//   toneMarks: string;

//   @Column({
//     name: 'part_of_speech',
//     type: 'varchar',
//     length: 20,
//     nullable: true,
//   })
//   partOfSpeech: string;

//   @Column({ name: 'hsk_level', type: 'tinyint', nullable: true })
//   hskLevel: number;

//   @Column({ name: 'frequency_rank', type: 'int', nullable: true })
//   frequencyRank: number;

//   @Column({
//     name: 'usage_context',
//     type: 'varchar',
//     length: 100,
//     nullable: true,
//   })
//   usageContext: string;

//   @Column({ name: 'is_primary', type: 'boolean', default: false })
//   isPrimary: boolean;

//   Relations;
//   @ManyToOne(() => Word, (word) => word.senses)
//   @JoinColumn({ name: 'word_id' })
//   word: Word;

//   @OneToMany(() => WordSenseMeaning, (meaning) => meaning.wordSense)
//   meanings: WordSenseMeaning[];
// }
