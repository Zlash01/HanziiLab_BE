import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './modules/users/entities/user.entity';
import { Courses } from './modules/courses/entities/course.entities';
import { Word } from './modules/words/entities/word.entity';
import { WordSense } from './modules/words/entities/word-sense.entity';
import { WordSenseTranslation } from './modules/words/entities/word-sense-translation.entity';
import { GrammarPattern } from './modules/grammar/entities/grammar-pattern.entity';
import { GrammarTranslation } from './modules/grammar/entities/grammar-translation.entity';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CoursesModule } from './modules/courses/courses.module';
import { WordsModule } from './modules/words/words.module';
import { GrammarModule } from './modules/grammar/grammar.module';
import { LessonsModule } from './modules/lessons/lessons.module';
import { Lessons } from './modules/lessons/entities/lesson.entities';
import { LessonWord } from './modules/lessons/entities/lesson-word.entity';
import { LessonGrammarPattern } from './modules/lessons/entities/lesson-grammar-pattern.entity';
import { Content } from './modules/lessons/entities/content.entity';
import { Question } from './modules/lessons/entities/question.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes the configuration available globally
      envFilePath: '.env', // You can load additional configuration files or objects here
    }),
    // TypeORM configuration
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        console.log('DB config:', {
          host: configService.get<string>('DB_HOST'),
          port: parseInt(configService.get<string>('DB_PORT') ?? '3306'),
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_DATABASE'),
        });

        return {
          type: 'mysql',
          host: configService.get<string>('DB_HOST'),
          port: parseInt(configService.get<string>('DB_PORT') ?? '3306'),
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_DATABASE'),
          entities: [
            User,
            Courses,
            Word,
            WordSense,
            WordSenseTranslation,
            GrammarPattern,
            GrammarTranslation,
            Lessons,
            LessonWord,
            LessonGrammarPattern,
            Content,
            Question,
          ],
          synchronize: true,
        };
      },
    }),
    AuthModule,
    UsersModule,
    CoursesModule,
    WordsModule,
    GrammarModule,
    LessonsModule,
  ],
})
export class AppModule {}
