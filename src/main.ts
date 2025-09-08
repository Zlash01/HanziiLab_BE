import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config } from 'dotenv';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Chinese Language Learning API')
    .setDescription(
      `
      # Chinese Language Learning Platform API

      This comprehensive API provides functionality for managing a Chinese language learning platform with the following features:

      ## Features
      - **User Management**: Registration, authentication, and profile management
      - **Course Management**: HSK-level structured courses with prerequisites
      - **Lesson Management**: Interactive lessons within courses
      - **Word Management**: Comprehensive dictionary with word senses and translations
      - **Grammar System**: Grammar patterns and translations
      - **Sentence System**: Example sentences with token-based breakdown
      - **Content Management**: Structured learning content with interactive elements

      ## Authentication
      Most endpoints require JWT authentication. Admin endpoints require admin role.
      
      ## Role-Based Access
      - **User**: Can access learning content and manage own profile
      - **Admin**: Full access to all CRUD operations

      ## HSK Levels
      Supports HSK levels 1-9 for structured Chinese language learning progression.

      ## Base URL
      All API endpoints are relative to: \`/api\`
    `,
    )
    .setVersion('1.0')
    .setContact(
      'Chinese Learning Platform',
      'https://example.com',
      'support@example.com',
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addServer('http://localhost:3000', 'Development Server')
    .addServer('https://api.chinese-learning.com', 'Production Server')
    .addTag('auth', 'Authentication and user registration')
    .addTag('users', 'User profile and account management')
    .addTag('courses', 'Course management and HSK level organization')
    .addTag('lessons', 'Lesson content and structure management')
    .addTag('words', 'Chinese word dictionary and sense management')
    .addTag('word-senses', 'Word meanings and definitions')
    .addTag('word-sense-translations', 'Multilingual word translations')
    .addTag('grammar', 'Grammar pattern and rule management')
    .addTag('grammar-patterns', 'Chinese grammar pattern definitions')
    .addTag('grammar-translations', 'Grammar pattern translations')
    .addTag('sentences', 'Example sentences and dialogue management')
    .addTag(
      'sentence-translations',
      'Sentence translations in multiple languages',
    )
    .addTag(
      'sentence-tokens',
      'Word-by-word sentence breakdown for interactive learning',
    )
    .addTag('content', 'Lesson content including questions and materials')
    .addTag('questions', 'Interactive questions and exercises')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
