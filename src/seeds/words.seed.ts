import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { WordsService } from '../modules/words/words.service';
import { WordSensesService } from '../modules/words/word-senses.service';
import { WordSenseTranslationsService } from '../modules/words/word-sense-translations.service';
import { Word } from '../modules/words/entities/word.entity';
import { WordSense } from '../modules/words/entities/word-sense.entity';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const wordsService = app.get(WordsService);
  const wordSensesService = app.get(WordSensesService);
  const wordSenseTranslationsService = app.get(WordSenseTranslationsService);

  console.log('🌱 Starting to seed words data...');

  // Sample words data
  const wordsData = [
    {
      simplified: '你好',
      traditional: '你好',
      isCompound: true,
      characterCount: 2,
    },
    {
      simplified: '我',
      traditional: '我',
      isCompound: false,
      characterCount: 1,
    },
    {
      simplified: '打',
      traditional: '打',
      isCompound: false,
      characterCount: 1,
    },
    {
      simplified: '电话',
      traditional: '電話',
      isCompound: true,
      characterCount: 2,
    },
    {
      simplified: '中文',
      traditional: '中文',
      isCompound: true,
      characterCount: 2,
    },
    {
      simplified: '学习',
      traditional: '學習',
      isCompound: true,
      characterCount: 2,
    },
    {
      simplified: '吃',
      traditional: '吃',
      isCompound: false,
      characterCount: 1,
    },
    {
      simplified: '饭',
      traditional: '飯',
      isCompound: false,
      characterCount: 1,
    },
    {
      simplified: '水',
      traditional: '水',
      isCompound: false,
      characterCount: 1,
    },
    {
      simplified: '喝',
      traditional: '喝',
      isCompound: false,
      characterCount: 1,
    },
  ];

  // Create words
  const createdWords: Word[] = [];
  for (const wordData of wordsData) {
    try {
      const word = await wordsService.create(wordData);
      createdWords.push(word);
      console.log(`✅ Created word: ${word.simplified}`);
    } catch (error) {
      console.log(`⚠️ Word ${wordData.simplified} might already exist`);
      console.log(`   Error: ${error}`);
      // Try to find existing word
      try {
        const existingWord = await wordsService.findBySimplified(
          wordData.simplified,
        );
        createdWords.push(existingWord);
      } catch {
        console.log(`❌ Could not find or create word: ${wordData.simplified}`);
      }
    }
  }

  // Sample word senses data
  const wordSensesData = [
    // 你好 - Hello
    {
      wordId: createdWords.find((w) => w.simplified === '你好')?.id,
      senseNumber: 1,
      pinyin: 'nǐ hǎo',
      partOfSpeech: 'interjection',
      hskLevel: 1,
      usageContext: 'greeting',
      isPrimary: true,
      exampleContext: '你好，我叫李明。',
    },
    // 我 - I/me
    {
      wordId: createdWords.find((w) => w.simplified === '我')?.id,
      senseNumber: 1,
      pinyin: 'wǒ',
      partOfSpeech: 'pronoun',
      hskLevel: 1,
      usageContext: 'casual',
      isPrimary: true,
      exampleContext: '我是学生。',
    },
    // 打 - hit/play/make (phone call)
    {
      wordId: createdWords.find((w) => w.simplified === '打')?.id,
      senseNumber: 1,
      pinyin: 'dǎ',
      partOfSpeech: 'verb',
      hskLevel: 2,
      usageContext: 'general',
      isPrimary: true,
      exampleContext: '打球',
    },
    {
      wordId: createdWords.find((w) => w.simplified === '打')?.id,
      senseNumber: 2,
      pinyin: 'dǎ',
      partOfSpeech: 'verb',
      hskLevel: 2,
      usageContext: 'communication',
      isPrimary: false,
      exampleContext: '打电话',
    },
    {
      wordId: createdWords.find((w) => w.simplified === '打')?.id,
      senseNumber: 3,
      pinyin: 'dǎ',
      partOfSpeech: 'verb',
      hskLevel: 3,
      usageContext: 'violence',
      isPrimary: false,
      exampleContext: '打人',
    },
    // 电话 - telephone
    {
      wordId: createdWords.find((w) => w.simplified === '电话')?.id,
      senseNumber: 1,
      pinyin: 'diàn huà',
      partOfSpeech: 'noun',
      hskLevel: 2,
      usageContext: 'technology',
      isPrimary: true,
      exampleContext: '我的电话号码是123456。',
    },
    // 中文 - Chinese language
    {
      wordId: createdWords.find((w) => w.simplified === '中文')?.id,
      senseNumber: 1,
      pinyin: 'zhōng wén',
      partOfSpeech: 'noun',
      hskLevel: 2,
      usageContext: 'language',
      isPrimary: true,
      exampleContext: '我在学中文。',
    },
    // 学习 - study/learn
    {
      wordId: createdWords.find((w) => w.simplified === '学习')?.id,
      senseNumber: 1,
      pinyin: 'xué xí',
      partOfSpeech: 'verb',
      hskLevel: 2,
      usageContext: 'education',
      isPrimary: true,
      exampleContext: '我在学习中文。',
    },
    // 吃 - eat
    {
      wordId: createdWords.find((w) => w.simplified === '吃')?.id,
      senseNumber: 1,
      pinyin: 'chī',
      partOfSpeech: 'verb',
      hskLevel: 1,
      usageContext: 'daily life',
      isPrimary: true,
      exampleContext: '吃饭',
    },
    // 饭 - rice/meal
    {
      wordId: createdWords.find((w) => w.simplified === '饭')?.id,
      senseNumber: 1,
      pinyin: 'fàn',
      partOfSpeech: 'noun',
      hskLevel: 1,
      usageContext: 'food',
      isPrimary: true,
      exampleContext: '吃饭',
    },
    // 水 - water
    {
      wordId: createdWords.find((w) => w.simplified === '水')?.id,
      senseNumber: 1,
      pinyin: 'shuǐ',
      partOfSpeech: 'noun',
      hskLevel: 1,
      usageContext: 'beverage',
      isPrimary: true,
      exampleContext: '喝水',
    },
    // 喝 - drink
    {
      wordId: createdWords.find((w) => w.simplified === '喝')?.id,
      senseNumber: 1,
      pinyin: 'hē',
      partOfSpeech: 'verb',
      hskLevel: 1,
      usageContext: 'daily life',
      isPrimary: true,
      exampleContext: '喝水',
    },
  ];

  // Create word senses
  const createdWordSenses: WordSense[] = [];
  for (const senseData of wordSensesData) {
    if (senseData.wordId) {
      try {
        const wordSense = await wordSensesService.create({
          ...senseData,
          wordId: senseData.wordId,
        });
        createdWordSenses.push(wordSense);
        console.log(
          `✅ Created word sense: ${senseData.pinyin} (sense #${senseData.senseNumber})`,
        );
      } catch {
        console.log(
          `⚠️ Word sense ${senseData.pinyin} #${senseData.senseNumber} might already exist`,
        );
      }
    }
  }

  // Sample translations data
  const translationsData = [
    // 你好 translations
    {
      wordSenseId: createdWordSenses.find((s) => s.pinyin === 'nǐ hǎo')?.id,
      language: 'en',
      translation: 'hello, hi',
      usageNotes: 'Common greeting used at any time of day',
    },
    {
      wordSenseId: createdWordSenses.find((s) => s.pinyin === 'nǐ hǎo')?.id,
      language: 'vn',
      translation: 'xin chào',
      usageNotes: 'Lời chào phổ biến',
    },
    // 我 translations
    {
      wordSenseId: createdWordSenses.find((s) => s.pinyin === 'wǒ')?.id,
      language: 'en',
      translation: 'I, me',
      usageNotes: 'First person singular pronoun',
    },
    {
      wordSenseId: createdWordSenses.find((s) => s.pinyin === 'wǒ')?.id,
      language: 'vn',
      translation: 'tôi',
      usageNotes: 'Đại từ nhân xưng ngôi thứ nhất',
    },
    // 打 translations (sense 1 - play/hit)
    {
      wordSenseId: createdWordSenses.find(
        (s) => s.pinyin === 'dǎ' && s.senseNumber === 1,
      )?.id,
      language: 'en',
      translation: 'to play (sports), to hit',
      usageNotes: 'Used for sports and physical actions',
    },
    {
      wordSenseId: createdWordSenses.find(
        (s) => s.pinyin === 'dǎ' && s.senseNumber === 1,
      )?.id,
      language: 'vn',
      translation: 'chơi (thể thao), đánh',
      usageNotes: 'Dùng cho thể thao và hành động vật lý',
    },
    // 打 translations (sense 2 - make phone call)
    {
      wordSenseId: createdWordSenses.find(
        (s) => s.pinyin === 'dǎ' && s.senseNumber === 2,
      )?.id,
      language: 'en',
      translation: 'to make (a phone call)',
      usageNotes: 'Used specifically for making phone calls',
    },
    {
      wordSenseId: createdWordSenses.find(
        (s) => s.pinyin === 'dǎ' && s.senseNumber === 2,
      )?.id,
      language: 'vn',
      translation: 'gọi (điện thoại)',
      usageNotes: 'Dùng riêng cho việc gọi điện thoại',
    },
    // 打 translations (sense 3 - hit/beat)
    {
      wordSenseId: createdWordSenses.find(
        (s) => s.pinyin === 'dǎ' && s.senseNumber === 3,
      )?.id,
      language: 'en',
      translation: 'to hit, to beat, to fight',
      usageNotes: 'Physical violence context',
    },
    {
      wordSenseId: createdWordSenses.find(
        (s) => s.pinyin === 'dǎ' && s.senseNumber === 3,
      )?.id,
      language: 'vn',
      translation: 'đánh, đấm',
      usageNotes: 'Bối cảnh bạo lực',
    },
    // More translations for other words...
    {
      wordSenseId: createdWordSenses.find((s) => s.pinyin === 'diàn huà')?.id,
      language: 'en',
      translation: 'telephone, phone',
      usageNotes: 'Communication device',
    },
    {
      wordSenseId: createdWordSenses.find((s) => s.pinyin === 'diàn huà')?.id,
      language: 'vn',
      translation: 'điện thoại',
      usageNotes: 'Thiết bị liên lạc',
    },
    {
      wordSenseId: createdWordSenses.find((s) => s.pinyin === 'zhōng wén')?.id,
      language: 'en',
      translation: 'Chinese language',
      usageNotes: 'Refers to the Chinese language in general',
    },
    {
      wordSenseId: createdWordSenses.find((s) => s.pinyin === 'zhōng wén')?.id,
      language: 'vn',
      translation: 'tiếng Trung',
      usageNotes: 'Chỉ ngôn ngữ tiếng Trung nói chung',
    },
    {
      wordSenseId: createdWordSenses.find((s) => s.pinyin === 'xué xí')?.id,
      language: 'en',
      translation: 'to study, to learn',
      usageNotes: 'Educational context',
    },
    {
      wordSenseId: createdWordSenses.find((s) => s.pinyin === 'xué xí')?.id,
      language: 'vn',
      translation: 'học tập, học',
      usageNotes: 'Bối cảnh giáo dục',
    },
    {
      wordSenseId: createdWordSenses.find((s) => s.pinyin === 'chī')?.id,
      language: 'en',
      translation: 'to eat',
      usageNotes: 'Basic verb for eating',
    },
    {
      wordSenseId: createdWordSenses.find((s) => s.pinyin === 'chī')?.id,
      language: 'vn',
      translation: 'ăn',
      usageNotes: 'Động từ cơ bản cho việc ăn',
    },
    {
      wordSenseId: createdWordSenses.find((s) => s.pinyin === 'fàn')?.id,
      language: 'en',
      translation: 'rice, meal',
      usageNotes: 'Can refer to rice specifically or meals in general',
    },
    {
      wordSenseId: createdWordSenses.find((s) => s.pinyin === 'fàn')?.id,
      language: 'vn',
      translation: 'cơm, bữa ăn',
      usageNotes: 'Có thể chỉ cơm cụ thể hoặc bữa ăn nói chung',
    },
    {
      wordSenseId: createdWordSenses.find((s) => s.pinyin === 'shuǐ')?.id,
      language: 'en',
      translation: 'water',
      usageNotes: 'Basic liquid',
    },
    {
      wordSenseId: createdWordSenses.find((s) => s.pinyin === 'shuǐ')?.id,
      language: 'vn',
      translation: 'nước',
      usageNotes: 'Chất lỏng cơ bản',
    },
    {
      wordSenseId: createdWordSenses.find((s) => s.pinyin === 'hē')?.id,
      language: 'en',
      translation: 'to drink',
      usageNotes: 'Basic verb for drinking',
    },
    {
      wordSenseId: createdWordSenses.find((s) => s.pinyin === 'hē')?.id,
      language: 'vn',
      translation: 'uống',
      usageNotes: 'Động từ cơ bản cho việc uống',
    },
  ];

  // Create translations
  for (const translationData of translationsData) {
    if (translationData.wordSenseId) {
      try {
        await wordSenseTranslationsService.create({
          ...translationData,
          wordSenseId: translationData.wordSenseId,
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

  console.log('🎉 Seeding completed!');
  console.log(`📊 Summary:`);
  console.log(`   - Words: ${createdWords.length}`);
  console.log(`   - Word senses: ${createdWordSenses.length}`);
  console.log(
    `   - Translations: ${translationsData.filter((t) => t.wordSenseId).length} attempted`,
  );

  await app.close();
}

seed().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
