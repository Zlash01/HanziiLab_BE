import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { Lessons } from '../modules/lessons/entities/lesson.entities';
import { Content } from '../modules/lessons/entities/content.entity';
import { Question } from '../modules/lessons/entities/question.entity';
import { ContentType } from '../modules/lessons/enums/content-type.enum';
import { QuestionType } from '../modules/lessons/enums/question-type.enum';
// import { LessonWord } from '../modules/lessons/entities/lesson-word.entity';
// import { LessonGrammarPattern } from '../modules/lessons/entities/lesson-grammar-pattern.entity';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    console.log('Starting lesson seeding...');

    // Create a new lesson for course ID 1
    const lessonData: Partial<Lessons> = {
      name: 'Introduction to Chinese Greetings',
      description: 'Learn basic Chinese greetings and introductions',
      courseId: 1,
      orderIndex: 1,
      isActive: true,
    };

    const lessonRepository = dataSource.getRepository(Lessons);
    const lesson = lessonRepository.create(lessonData);
    const savedLesson = await lessonRepository.save(lesson);
    console.log(`Created lesson: ${savedLesson.name} (ID: ${savedLesson.id})`);

    // Create content items for the lesson
    const contentRepository = dataSource.getRepository(Content);
    
    // Content 1: Word Definition
    const wordDefinitionContent = contentRepository.create({
      lessonId: savedLesson.id,
      orderIndex: 1,
      type: ContentType.WORD_DEFINITION,
      data: {
        word: '你好',
        pinyin: 'nǐ hǎo',
        english: 'hello',
        definition: 'A common greeting used in Chinese, literally meaning "you good"',
        examples: [
          {
            chinese: '你好，我是王明。',
            pinyin: 'nǐ hǎo, wǒ shì wáng míng.',
            english: 'Hello, I am Wang Ming.'
          }
        ]
      },
      isActive: true,
    });
    await contentRepository.save(wordDefinitionContent);
    console.log('Created word definition content');

    // Content 2: Sentences
    const sentencesContent = contentRepository.create({
      lessonId: savedLesson.id,
      orderIndex: 2,
      type: ContentType.SENTENCES,
      data: {
        title: 'Common Greeting Sentences',
        sentences: [
          {
            chinese: '你好吗？',
            pinyin: 'nǐ hǎo ma?',
            english: 'How are you?',
            audio: '/audio/nihao-ma.mp3'
          },
          {
            chinese: '我很好，谢谢。',
            pinyin: 'wǒ hěn hǎo, xiè xie.',
            english: 'I am fine, thank you.',
            audio: '/audio/wo-hen-hao.mp3'
          },
          {
            chinese: '再见！',
            pinyin: 'zài jiàn!',
            english: 'Goodbye!',
            audio: '/audio/zaijian.mp3'
          }
        ]
      },
      isActive: true,
    });
    await contentRepository.save(sentencesContent);
    console.log('Created sentences content');

    // Create question items for the lesson
    const questionRepository = dataSource.getRepository(Question);

    // Question 1: Audio Image Question
    const audioImageQuestion = questionRepository.create({
      lessonId: savedLesson.id,
      orderIndex: 3,
      questionType: QuestionType.AUDIO_IMAGE,
      data: {
        instruction: 'Listen to the audio and select the correct image',
        audio: '/audio/nihao.mp3',
        options: [
          {
            id: 'A',
            image: '/images/greeting1.jpg',
            alt: 'Two people shaking hands'
          },
          {
            id: 'B',
            image: '/images/greeting2.jpg',
            alt: 'Person waving goodbye'
          },
          {
            id: 'C',
            image: '/images/greeting3.jpg',
            alt: 'People bowing to each other'
          }
        ],
        correctAnswer: 'A',
        explanation: '你好 (nǐ hǎo) means hello, which is typically accompanied by a handshake or greeting gesture.'
      },
      isActive: true,
    });
    await questionRepository.save(audioImageQuestion);
    console.log('Created audio image question');

    // Question 2: Text Selection Question
    const textSelectionQuestion = questionRepository.create({
      lessonId: savedLesson.id,
      orderIndex: 4,
      questionType: QuestionType.TEXT_SELECTION,
      data: {
        instruction: 'Select the correct pinyin for 你好',
        question: 'What is the pinyin for 你好?',
        options: [
          { id: 'A', text: 'nǐ hǎo' },
          { id: 'B', text: 'nǐ háo' },
          { id: 'C', text: 'ní hǎo' },
          { id: 'D', text: 'nì hào' }
        ],
        correctAnswer: 'A',
        explanation: 'The correct pinyin for 你好 is "nǐ hǎo" with third tone on 你 (nǐ) and third tone on 好 (hǎo).'
      },
      isActive: true,
    });
    await questionRepository.save(textSelectionQuestion);
    console.log('Created text selection question');

    // Question 3: Matching Text Question
    const matchingTextQuestion = questionRepository.create({
      lessonId: savedLesson.id,
      orderIndex: 5,
      questionType: QuestionType.MATCHING_TEXT,
      data: {
        instruction: 'Match the Chinese phrases with their English translations',
        leftColumn: [
          { id: '1', text: '你好' },
          { id: '2', text: '再见' },
          { id: '3', text: '谢谢' },
          { id: '4', text: '对不起' }
        ],
        rightColumn: [
          { id: 'A', text: 'Thank you' },
          { id: 'B', text: 'Hello' },
          { id: 'C', text: 'Goodbye' },
          { id: 'D', text: 'Sorry' }
        ],
        correctMatches: [
          { left: '1', right: 'B' },
          { left: '2', right: 'C' },
          { left: '3', right: 'A' },
          { left: '4', right: 'D' }
        ]
      },
      isActive: true,
    });
    await questionRepository.save(matchingTextQuestion);
    console.log('Created matching text question');

    // Question 4: Fill in the Blank Question
    const fillBlankQuestion = questionRepository.create({
      lessonId: savedLesson.id,
      orderIndex: 6,
      questionType: QuestionType.FILL_BLANK,
      data: {
        instruction: 'Fill in the blank with the correct Chinese character',
        sentence: '___好，我是李明。',
        pinyin: '___hǎo, wǒ shì lǐ míng.',
        english: '___hello, I am Li Ming.',
        options: ['你', '我', '他', '她'],
        correctAnswer: '你',
        explanation: '你好 means "hello" - 你 (you) + 好 (good/well).'
      },
      isActive: true,
    });
    await questionRepository.save(fillBlankQuestion);
    console.log('Created fill blank question');

    // Question 5: Audio Boolean Question
    const audioBoolQuestion = questionRepository.create({
      lessonId: savedLesson.id,
      orderIndex: 7,
      questionType: QuestionType.AUDIO_BOOL,
      data: {
        instruction: 'Listen to the audio. Is this a greeting?',
        audio: '/audio/nihao-question.mp3',
        transcript: '你好吗？',
        pinyin: 'nǐ hǎo ma?',
        english: 'How are you?',
        correctAnswer: true,
        explanation: '你好吗 (nǐ hǎo ma) is indeed a greeting that means "How are you?" or "Are you well?"'
      },
      isActive: true,
    });
    await questionRepository.save(audioBoolQuestion);
    console.log('Created audio boolean question');

    // Optionally add some lesson words (if word senses exist in the database)
    // Note: This would require existing WordSense records in the database
    /*
    const lessonWordRepository = dataSource.getRepository(LessonWord);
    const lessonWord = lessonWordRepository.create({
      lessonId: savedLesson.id,
      wordSenseId: 1, // Assuming a word sense with ID 1 exists
      orderIndex: 1,
    });
    await lessonWordRepository.save(lessonWord);
    console.log('Added lesson word');
    */

    // Optionally add some lesson grammar patterns (if grammar patterns exist in the database)
    /*
    const lessonGrammarRepository = dataSource.getRepository(LessonGrammarPattern);
    const lessonGrammar = lessonGrammarRepository.create({
      lessonId: savedLesson.id,
      grammarPatternId: 1, // Assuming a grammar pattern with ID 1 exists
      orderIndex: 1,
    });
    await lessonGrammarRepository.save(lessonGrammar);
    console.log('Added lesson grammar pattern');
    */

    console.log('Lesson seeding completed successfully!');
    console.log(`Lesson ID: ${savedLesson.id}`);
    console.log('Created content items: 2');
    console.log('Created question items: 5');

  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    await app.close();
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seed().catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
}

export { seed };

async function seedComprehensiveLesson() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    console.log('Starting comprehensive lesson seeding...');

    // Create a new lesson for course ID 1 - Chinese Classifier Words
    const lessonData: Partial<Lessons> = {
      name: 'Chinese Classifier Words - 家 (jiā)',
      description: 'Learn about the Chinese classifier word 家 (jiā) and its usage with nouns like family, shops, and factories',
      courseId: 1,
      orderIndex: 2,
      isActive: true,
    };

    const lessonRepository = dataSource.getRepository(Lessons);
    const lesson = lessonRepository.create(lessonData);
    const savedLesson = await lessonRepository.save(lesson);
    console.log(`Created lesson: ${savedLesson.name} (ID: ${savedLesson.id})`);

    // Create content items for the lesson
    const contentRepository = dataSource.getRepository(Content);
    
    // Content 1: Word Definition
    const wordDefinitionContent = contentRepository.create({
      lessonId: savedLesson.id,
      orderIndex: 1,
      type: ContentType.WORD_DEFINITION,
      data: {
        picture_url: "example.url",
        audio_url: "audio.example",
        chinese_text: "家",
        pinyin: "jiā",
        part_of_speech: "số lượng từ",
        explaination: "đây là lượng từ, dùng với các danh từ như gia đình, cửa hàng",
        additional_info: "'家' trong Trường hợp này là lượng từ, dùng với các danh từ như gia đình, cửa hàng, công xưởng…\\ Ví dụ '一家上店' (Yījiā shàng diàn) (Một cửa hàng), '三家工厂' (Sānjiā gōngchǎng) (Ba công xưởng)"
      },
      isActive: true,
    });
    await contentRepository.save(wordDefinitionContent);
    console.log('Created word definition content');

    // Content 2: Sentences
    const sentencesContent = contentRepository.create({
      lessonId: savedLesson.id,
      orderIndex: 2,
      type: ContentType.SENTENCES,
      data: {
        picture_url: "example.url",
        audio_url: "audio.example",
        chinese_text: "这|家|饭店|怎么样|?",
        pinyin: "Zhè|jiā|fàndiàn|zěnmeyàng|?",
        additional_info: "'家' trong Trường hợp này là lượng từ, dùng với các danh từ như gia đình, cửa hàng, công xưởng…\\ Ví dụ '一家上店' (Yījiā shàng diàn) (Một cửa hàng), '三家工厂' (Sānjiā gōngchǎng) (Ba công xưởng)"
      },
      isActive: true,
    });
    await contentRepository.save(sentencesContent);
    console.log('Created sentences content');

    // Create question items for the lesson
    const questionRepository = dataSource.getRepository(Question);

    // Question 1: Audio Image Question
    const audioImageQuestion = questionRepository.create({
      lessonId: savedLesson.id,
      orderIndex: 3,
      questionType: QuestionType.AUDIO_IMAGE,
      data: {
        audio_url: "example.url",
        audio_transcript_chinese: "一|家|上店",
        audio_transcript_pinyin: "Yī|jiā|shàngdiàn",
        audio_transcript_translation: "Một cửa hàng",
        answers: [
          {
            id: 1,
            image_url: "example.url",
            label: "一|家|上店",
            correct: true
          },
          {
            id: 2,
            image_url: "wrong_example.url",
            label: "蛋糕",
            correct: false
          }
        ]
      },
      isActive: true,
    });
    await questionRepository.save(audioImageQuestion);
    console.log('Created audio image question');

    // Question 2: Text Selection Question
    const textSelectionQuestion = questionRepository.create({
      lessonId: savedLesson.id,
      orderIndex: 4,
      questionType: QuestionType.TEXT_SELECTION,
      data: {
        question_text: "này là lượng từ, dùng với các danh từ như gia đình, cửa hàng",
        answers: [
          {
            id: 1,
            text: "家",
            pinyin: "jiā",
            correct: true
          },
          {
            id: 2,
            text: "蛋糕",
            pinyin: "dàngāo",
            correct: false
          }
        ]
      },
      isActive: true,
    });
    await questionRepository.save(textSelectionQuestion);
    console.log('Created text selection question');

    // Question 3: Matching Text Question
    const matchingTextQuestion = questionRepository.create({
      lessonId: savedLesson.id,
      orderIndex: 5,
      questionType: QuestionType.MATCHING_TEXT,
      data: {
        instructions: "Chọn cặp tương ứng.",
        items: [
          {
            id: 1,
            chinese: "不錯",
            pinyin: "bù cuò",
            audio_url: "audio/bucuo.mp3"
          },
          {
            id: 2,
            chinese: "好吃",
            pinyin: "hǎo chī",
            audio_url: "audio/haochi.mp3"
          },
          {
            id: 3,
            chinese: "贵",
            pinyin: "guì",
            audio_url: "audio/gui.mp3"
          },
          {
            id: 4,
            chinese: "家",
            pinyin: "jiā",
            audio_url: "audio/jia.mp3"
          }
        ],
        definitions: [
          {
            id: 1,
            text: "tốt; khá; không tệ"
          },
          {
            id: 2,
            text: "ngon"
          },
          {
            id: 3,
            text: "đắt, mắc"
          },
          {
            id: 4,
            text: "này là lượng từ, dùng với các danh từ như gia đình, cửa hàng"
          }
        ],
        correct_matches: [
          { item_id: 1, definition_id: 1 },
          { item_id: 2, definition_id: 2 },
          { item_id: 3, definition_id: 3 },
          { item_id: 4, definition_id: 4 }
        ]
      },
      isActive: true,
    });
    await questionRepository.save(matchingTextQuestion);
    console.log('Created matching text question');

    // Question 4: Fill in the Blank Question
    const fillBlankQuestion = questionRepository.create({
      lessonId: savedLesson.id,
      orderIndex: 6,
      questionType: QuestionType.FILL_BLANK,
      data: {
        instructions: "Chọn từ điền vào chỗ trống.",
        sentence: "我|家| ____ |有|一| ____ |苹果|商店。",
        sentence_pinyin: "Wǒ|jiā| ____ |yǒu|yī| ____ |píngguǒ|shāngdiàn.",
        translation: "Có một cửa hàng táo bên cạnh nhà tôi.",
        image_url: "example_image.url",
        options: [
          { id: 1, text: "家", pinyin: "jiā" },
          { id: 2, text: "旁边", pinyin: "pángbiān" },
          { id: 3, text: "块", pinyin: "kuài" },
          { id: 4, text: "他", pinyin: "tā" }
        ],
        correct_answers: [
          { blank_index: 1, option_id: 2 },
          { blank_index: 2, option_id: 1 }
        ]
      },
      isActive: true,
    });
    await questionRepository.save(fillBlankQuestion);
    console.log('Created fill blank question');

    // Question 5: Audio Boolean Question
    const audioBoolQuestion = questionRepository.create({
      lessonId: savedLesson.id,
      orderIndex: 7,
      questionType: QuestionType.AUDIO_BOOL,
      data: {
        audio_url: "example.url",
        audio_transcript_chinese: "这|个|菜|太|好|吃|了|,|我|都|吃|完|了",
        audio_transcript_pinyin: "Zhè|gè|cài|tài|hǎo|chī|le|,|wǒ|dōu|chī|wán|le",
        audio_transcript_translation: "Món này quá ngon, tôi đã ăn hết rồi",
        question_text: "他喜欢吃这个菜",
        question_pinyin: "Tā xǐhuān chī zhè gè cài",
        question_translation: "Anh ấy thích ăn món ăn này",
        correct: true
      },
      isActive: true,
    });
    await questionRepository.save(audioBoolQuestion);
    console.log('Created audio boolean question');

    // Question 6: Matching Audio Question
    const matchingAudioQuestion = questionRepository.create({
      lessonId: savedLesson.id,
      orderIndex: 8,
      questionType: QuestionType.MATCHING_AUDIO,
      data: {
        instructions: "Nghe âm thanh và chọn nghĩa tương ứng.",
        items: [
          {
            id: 1,
            chinese: "不錯",
            pinyin: "bù cuò",
            audio_url: "audio/bucuo.mp3"
          },
          {
            id: 2,
            chinese: "好吃",
            pinyin: "hǎo chī",
            audio_url: "audio/haochi.mp3"
          },
          {
            id: 3,
            chinese: "贵",
            pinyin: "guì",
            audio_url: "audio/gui.mp3"
          },
          {
            id: 4,
            chinese: "家",
            pinyin: "jiā",
            audio_url: "audio/jia.mp3"
          }
        ],
        definitions: [
          {
            id: 1,
            text: "tốt; khá; không tệ"
          },
          {
            id: 2,
            text: "ngon"
          },
          {
            id: 3,
            text: "đắt, mắc"
          },
          {
            id: 4,
            text: "này là lượng từ, dùng với các danh từ như gia đình, cửa hàng"
          }
        ],
        correct_matches: [
          { item_id: 1, definition_id: 1 },
          { item_id: 2, definition_id: 2 },
          { item_id: 3, definition_id: 3 },
          { item_id: 4, definition_id: 4 }
        ]
      },
      isActive: true,
    });
    await questionRepository.save(matchingAudioQuestion);
    console.log('Created matching audio question');

    console.log('Comprehensive lesson seeding completed successfully!');
    console.log(`Lesson ID: ${savedLesson.id}`);
    console.log('Created content items: 2');
    console.log('Created question items: 6');

  } catch (error) {
    console.error('Error during comprehensive seeding:', error);
  } finally {
    await app.close();
  }
}

// Run the comprehensive seed function if this file is executed directly with "comprehensive" argument
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.includes('comprehensive')) {
    seedComprehensiveLesson().catch((error) => {
      console.error('Comprehensive seeding failed:', error);
      process.exit(1);
    });
  } else {
    seed().catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
  }
}

export { seedComprehensiveLesson };
