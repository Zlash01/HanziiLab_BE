import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SentencesService } from '../modules/sentences/sentences.service';
import { SentenceTranslationsService } from '../modules/sentences/sentence-translations.service';
import { SentenceTokensService } from '../modules/sentences/sentence-tokens.service';
import { SentenceType } from '../modules/sentences/enums/sentence-type.enum';
import { TokenType } from '../modules/sentences/enums/token-type.enum';
import { Sentence } from '../modules/sentences/entities/sentence.entity';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const sentencesService = app.get(SentencesService);
  const sentenceTranslationsService = app.get(SentenceTranslationsService);
  const sentenceTokensService = app.get(SentenceTokensService);

  console.log('🌱 Starting to seed sentences data...');

  // Sample sentences data
  const sentencesData = [
    {
      chineseText: '我是学生。',
      pinyin: 'Wǒ shì xuéshēng.',
      sentenceType: SentenceType.EXAMPLE,
      difficultyLevel: 1,
    },
    {
      chineseText: '他比我高。',
      pinyin: 'Tā bǐ wǒ gāo.',
      sentenceType: SentenceType.EXAMPLE,
      difficultyLevel: 2,
    },
    {
      chineseText: '如果明天下雨，我就不去了。',
      pinyin: 'Rúguǒ míngtiān xià yǔ, wǒ jiù bù qù le.',
      sentenceType: SentenceType.EXAMPLE,
      difficultyLevel: 3,
    },
    {
      chineseText: '你叫什么名字？',
      pinyin: 'Nǐ jiào shénme míngzì?',
      sentenceType: SentenceType.DIALOGUE,
      difficultyLevel: 1,
    },
    {
      chineseText: '不但天气很好，而且风景也很美。',
      pinyin: 'Bùdàn tiānqì hěn hǎo, érqiě fēngjǐng yě hěn měi.',
      sentenceType: SentenceType.EXAMPLE,
      difficultyLevel: 4,
    },
  ];

  // Create sentences
  const createdSentences: Sentence[] = [];
  for (const sentenceData of sentencesData) {
    try {
      const sentence = await sentencesService.create(sentenceData);
      createdSentences.push(sentence);
      console.log(`✅ Created sentence: ${sentence.chineseText}`);
    } catch (error) {
      console.log(
        `⚠️ Sentence ${sentenceData.chineseText} might already exist`,
      );
      console.log(`   Error: ${error}`);
    }
  }

  // Sample translations data
  const translationsData = [
    // Translations for "我是学生。"
    {
      sentenceId: createdSentences.find((s) => s.chineseText === '我是学生。')
        ?.id,
      language: 'en',
      translation: 'I am a student.',
      literalTranslation: 'I am student.',
    },
    {
      sentenceId: createdSentences.find((s) => s.chineseText === '我是学生。')
        ?.id,
      language: 'vn',
      translation: 'Tôi là học sinh.',
      literalTranslation: 'Tôi là học sinh.',
    },

    // Translations for "他比我高。"
    {
      sentenceId: createdSentences.find((s) => s.chineseText === '他比我高。')
        ?.id,
      language: 'en',
      translation: 'He is taller than me.',
      literalTranslation: 'He compare me tall.',
    },
    {
      sentenceId: createdSentences.find((s) => s.chineseText === '他比我高。')
        ?.id,
      language: 'vn',
      translation: 'Anh ấy cao hơn tôi.',
      literalTranslation: 'Anh ấy so sánh tôi cao.',
    },

    // Translations for conditional sentence
    {
      sentenceId: createdSentences.find(
        (s) => s.chineseText === '如果明天下雨，我就不去了。',
      )?.id,
      language: 'en',
      translation: "If it rains tomorrow, I won't go.",
      literalTranslation: 'If tomorrow rain fall, I then not go.',
    },
    {
      sentenceId: createdSentences.find(
        (s) => s.chineseText === '如果明天下雨，我就不去了。',
      )?.id,
      language: 'vn',
      translation: 'Nếu ngày mai mưa, tôi sẽ không đi.',
      literalTranslation: 'Nếu ngày mai mưa rơi, tôi thì không đi.',
    },

    // Translations for question
    {
      sentenceId: createdSentences.find(
        (s) => s.chineseText === '你叫什么名字？',
      )?.id,
      language: 'en',
      translation: 'What is your name?',
      literalTranslation: 'You call what name?',
    },
    {
      sentenceId: createdSentences.find(
        (s) => s.chineseText === '你叫什么名字？',
      )?.id,
      language: 'vn',
      translation: 'Tên bạn là gì?',
      literalTranslation: 'Bạn gọi gì tên?',
    },

    // Translations for complex sentence
    {
      sentenceId: createdSentences.find(
        (s) => s.chineseText === '不但天气很好，而且风景也很美。',
      )?.id,
      language: 'en',
      translation:
        'Not only is the weather good, but the scenery is also beautiful.',
      literalTranslation:
        'Not only weather very good, moreover scenery also very beautiful.',
    },
    {
      sentenceId: createdSentences.find(
        (s) => s.chineseText === '不但天气很好，而且风景也很美。',
      )?.id,
      language: 'vn',
      translation: 'Không chỉ thời tiết tốt, mà phong cảnh cũng rất đẹp.',
      literalTranslation:
        'Không chỉ thời tiết rất tốt, hơn nữa phong cảnh cũng rất đẹp.',
    },
  ];

  // Create translations
  for (const translationData of translationsData) {
    if (translationData.sentenceId) {
      try {
        await sentenceTranslationsService.create({
          ...translationData,
          sentenceId: translationData.sentenceId,
        });
        console.log(
          `✅ Created translation: ${translationData.translation} (${translationData.language})`,
        );
      } catch {
        console.log(
          `⚠️ Translation ${translationData.translation} (${translationData.language}) might already exist`,
        );
      }
    }
  }

  // Sample token data for one sentence: "我是学生。"
  const studentSentence = createdSentences.find(
    (s) => s.chineseText === '我是学生。',
  );
  if (studentSentence) {
    const tokensData = [
      {
        sentenceId: studentSentence.id,
        position: 1,
        chineseText: '我',
        tokenType: TokenType.WORD,
        isClickable: true,
      },
      {
        sentenceId: studentSentence.id,
        position: 2,
        chineseText: '是',
        tokenType: TokenType.GRAMMAR_PARTICLE,
        isClickable: true,
      },
      {
        sentenceId: studentSentence.id,
        position: 3,
        chineseText: '学生',
        tokenType: TokenType.WORD,
        isClickable: true,
      },
      {
        sentenceId: studentSentence.id,
        position: 4,
        chineseText: '。',
        tokenType: TokenType.PUNCTUATION,
        isClickable: false,
      },
    ];

    try {
      await sentenceTokensService.createMany(tokensData);
      console.log('✅ Created tokens for "我是学生。"');
    } catch {
      console.log('⚠️ Tokens for "我是学生。" might already exist');
    }
  }

  console.log('🎉 Sentences seeding completed!');
  console.log(`📊 Summary:`);
  console.log(`   - Sentences: ${createdSentences.length}`);
  console.log(
    `   - Translations: ${translationsData.filter((t) => t.sentenceId).length} attempted`,
  );

  await app.close();
}

seed().catch((error) => {
  console.error('❌ Sentences seeding failed:', error);
  process.exit(1);
});
