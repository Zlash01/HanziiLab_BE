import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { Lessons } from '../modules/lessons/entities/lesson.entities';
import { Content } from '../modules/lessons/entities/content.entity';
import { Question } from '../modules/lessons/entities/question.entity';

async function verifyLessonData() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    console.log('Verifying lesson data...');

    const lessonRepository = dataSource.getRepository(Lessons);
    const contentRepository = dataSource.getRepository(Content);
    const questionRepository = dataSource.getRepository(Question);

    // Find the most recently created lesson for course ID 1
    const lesson = await lessonRepository.findOne({
      where: { courseId: 1 },
      order: { id: 'DESC' },
      relations: ['course'],
    });

    if (!lesson) {
      console.log('No lesson found for course ID 1');
      return;
    }

    console.log('Found lesson:');
    console.log(`- ID: ${lesson.id}`);
    console.log(`- Name: ${lesson.name}`);
    console.log(`- Description: ${lesson.description}`);
    console.log(`- Course ID: ${lesson.courseId}`);
    console.log(`- Order Index: ${lesson.orderIndex}`);
    console.log(`- Is Active: ${lesson.isActive}`);

    // Find content items for this lesson
    const contentItems = await contentRepository.find({
      where: { lessonId: lesson.id },
      order: { orderIndex: 'ASC' },
    });

    console.log(`\nFound ${contentItems.length} content items:`);
    contentItems.forEach((content, index) => {
      console.log(`${index + 1}. Type: ${content.type}, Order: ${content.orderIndex}`);
      console.log(`   Data: ${JSON.stringify(content.data, null, 2)}`);
    });

    // Find question items for this lesson
    const questionItems = await questionRepository.find({
      where: { lessonId: lesson.id },
      order: { orderIndex: 'ASC' },
    });

    console.log(`\nFound ${questionItems.length} question items:`);
    questionItems.forEach((question, index) => {
      console.log(`${index + 1}. Type: ${question.questionType}, Order: ${question.orderIndex}`);
      console.log(`   Data: ${JSON.stringify(question.data, null, 2)}`);
    });

    console.log('\nVerification completed successfully!');

  } catch (error) {
    console.error('Error during verification:', error);
  } finally {
    await app.close();
  }
}

// Run the verification function if this file is executed directly
if (require.main === module) {
  verifyLessonData().catch((error) => {
    console.error('Verification failed:', error);
    process.exit(1);
  });
}

export { verifyLessonData };
