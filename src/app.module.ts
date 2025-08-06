import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './modules/users/entities/user.entity';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CoursesController } from './modules/courses/courses.controller';
import { CoursesService } from './modules/courses/courses.service';
import { CoursesModule } from './modules/courses/courses.module';
import { UsersController } from './modules/users/users.controller';
import { UsersService } from './modules/users/users.service';

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
          entities: [User],
          synchronize: true,
        };
      },
    }),
    AuthModule,
    UsersModule,
    CoursesModule,
  ],
  controllers: [CoursesController, UsersController],
  providers: [CoursesService, UsersService],
})
export class AppModule {}
