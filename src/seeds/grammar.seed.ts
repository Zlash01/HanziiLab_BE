import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { GrammarPatternsService } from '../modules/grammar/grammar-patterns.service';
import { GrammarTranslationsService } from '../modules/grammar/grammar-translations.service';
import { GrammarPattern } from '../modules/grammar/entities/grammar-pattern.entity';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const grammarPatternsService = app.get(GrammarPatternsService);
  const grammarTranslationsService = app.get(GrammarTranslationsService);

  console.log('🌱 Starting to seed grammar data...');

  // Sample grammar patterns data
  const grammarPatternsData = [
    {
      pattern: '是...的',
      patternPinyin: 'shì ... de',
      patternFormula: 'Subject + 是 + Adjective/Noun + 的',
      hskLevel: 1,
      difficultyLevel: 1,
    },
    {
      pattern: '比...更...',
      patternPinyin: 'bǐ ... gèng ...',
      patternFormula: 'A + 比 + B + 更 + Adjective',
      hskLevel: 2,
      difficultyLevel: 2,
    },
    {
      pattern: '不但...而且...',
      patternPinyin: 'bù dàn ... ér qiě ...',
      patternFormula: '不但 + Sentence 1 + 而且 + Sentence 2',
      hskLevel: 3,
      difficultyLevel: 3,
    },
    {
      pattern: '如果...就...',
      patternPinyin: 'rú guǒ ... jiù ...',
      patternFormula: '如果 + Condition + 就 + Result',
      hskLevel: 2,
      difficultyLevel: 2,
    },
    {
      pattern: '一边...一边...',
      patternPinyin: 'yī biān ... yī biān ...',
      patternFormula: '一边 + Action 1 + 一边 + Action 2',
      hskLevel: 3,
      difficultyLevel: 3,
    },
    {
      pattern: '越来越...',
      patternPinyin: 'yuè lái yuè ...',
      patternFormula: 'Subject + 越来越 + Adjective',
      hskLevel: 2,
      difficultyLevel: 2,
    },
    {
      pattern: '虽然...但是...',
      patternPinyin: 'suī rán ... dàn shì ...',
      patternFormula: '虽然 + Sentence 1 + 但是 + Sentence 2',
      hskLevel: 3,
      difficultyLevel: 3,
    },
    {
      pattern: '把...V了',
      patternPinyin: 'bǎ ... V le',
      patternFormula: 'Subject + 把 + Object + Verb + 了',
      hskLevel: 4,
      difficultyLevel: 4,
    },
    {
      pattern: '被...V了',
      patternPinyin: 'bèi ... V le',
      patternFormula: 'Subject + 被 + Agent + Verb + 了',
      hskLevel: 4,
      difficultyLevel: 4,
    },
    {
      pattern: '连...都...',
      patternPinyin: 'lián ... dōu ...',
      patternFormula: '连 + Extreme Example + 都 + Verb/Adjective',
      hskLevel: 4,
      difficultyLevel: 4,
    },
  ];

  // Create grammar patterns
  const createdPatterns: GrammarPattern[] = [];
  for (const patternData of grammarPatternsData) {
    try {
      const pattern = await grammarPatternsService.create(patternData);
      createdPatterns.push(pattern);
      console.log(`✅ Created grammar pattern: ${pattern.pattern}`);
    } catch (error) {
      console.log(
        `⚠️ Grammar pattern ${patternData.pattern} might already exist`,
      );
      console.log(`   Error: ${error}`);
      // Try to find existing pattern
      try {
        const existingPattern = await grammarPatternsService.findByPattern(
          patternData.pattern,
        );
        createdPatterns.push(existingPattern);
      } catch {
        console.log(
          `❌ Could not find or create pattern: ${patternData.pattern}`,
        );
      }
    }
  }

  // Sample translations data
  const translationsData = [
    // 是...的 translations
    {
      grammarPatternId: createdPatterns.find((p) => p.pattern === '是...的')
        ?.id,
      language: 'en',
      title: 'The 是...的 (shì...de) Construction',
      explanation:
        'Used to emphasize a particular aspect of a past action or to describe characteristics.',
      whenToUse:
        'Use when you want to emphasize WHO, WHERE, WHEN, HOW, or WHY something was done in the past.',
      commonMistakes:
        "Don't forget the 的 at the end. Don't use with ongoing actions.",
    },
    {
      grammarPatternId: createdPatterns.find((p) => p.pattern === '是...的')
        ?.id,
      language: 'vn',
      title: 'Cấu trúc 是...的 (shì...de)',
      explanation:
        'Dùng để nhấn mạnh một khía cạnh cụ thể của hành động trong quá khứ hoặc mô tả đặc điểm.',
      whenToUse:
        'Sử dụng khi muốn nhấn mạnh AI, Ở ĐÂU, KHI NÀO, NHƯ THẾ NÀO, hoặc TẠI SAO điều gì đó được thực hiện trong quá khứ.',
      commonMistakes:
        'Đừng quên 的 ở cuối. Không dùng với hành động đang diễn ra.',
    },

    // 比...更... translations
    {
      grammarPatternId: createdPatterns.find((p) => p.pattern === '比...更...')
        ?.id,
      language: 'en',
      title: 'Comparative Pattern 比...更... (bǐ...gèng...)',
      explanation: 'Used to make comparisons, meaning "more [adjective] than".',
      whenToUse:
        'Use when comparing two things where one has more of a quality than the other.',
      commonMistakes:
        "Don't use 很 before the adjective. The order is fixed: A 比 B 更 + adjective.",
    },
    {
      grammarPatternId: createdPatterns.find((p) => p.pattern === '比...更...')
        ?.id,
      language: 'vn',
      title: 'Mẫu so sánh 比...更... (bǐ...gèng...)',
      explanation: 'Dùng để so sánh, có nghĩa là "[tính từ] hơn".',
      whenToUse:
        'Sử dụng khi so sánh hai thứ mà một thứ có nhiều đặc tính hơn thứ kia.',
      commonMistakes:
        'Không dùng 很 trước tính từ. Thứ tự cố định: A 比 B 更 + tính từ.',
    },

    // 不但...而且... translations
    {
      grammarPatternId: createdPatterns.find(
        (p) => p.pattern === '不但...而且...',
      )?.id,
      language: 'en',
      title: 'Not Only...But Also Pattern 不但...而且... (bùdàn...érqiě...)',
      explanation:
        'Used to express "not only...but also" to add emphasis or additional information.',
      whenToUse:
        'Use when you want to emphasize that two conditions or qualities both exist.',
      commonMistakes:
        "Both clauses should be parallel in structure. Don't use 也 with 而且.",
    },
    {
      grammarPatternId: createdPatterns.find(
        (p) => p.pattern === '不但...而且...',
      )?.id,
      language: 'vn',
      title: 'Mẫu Không chỉ...mà còn 不但...而且... (bùdàn...érqiě...)',
      explanation:
        'Dùng để diễn đạt "không chỉ...mà còn" để nhấn mạnh hoặc thêm thông tin.',
      whenToUse:
        'Sử dụng khi muốn nhấn mạnh rằng hai điều kiện hoặc tính chất đều tồn tại.',
      commonMistakes:
        'Cả hai mệnh đề phải có cấu trúc song song. Không dùng 也 với 而且.',
    },

    // 如果...就... translations
    {
      grammarPatternId: createdPatterns.find(
        (p) => p.pattern === '如果...就...',
      )?.id,
      language: 'en',
      title: 'Conditional Pattern 如果...就... (rúguǒ...jiù...)',
      explanation:
        'Used to express conditional statements meaning "if...then".',
      whenToUse: 'Use when stating a condition and its result or consequence.',
      commonMistakes:
        "就 can sometimes be omitted but it's better to include it for clarity.",
    },
    {
      grammarPatternId: createdPatterns.find(
        (p) => p.pattern === '如果...就...',
      )?.id,
      language: 'vn',
      title: 'Mẫu điều kiện 如果...就... (rúguǒ...jiù...)',
      explanation: 'Dùng để diễn đạt câu điều kiện có nghĩa "nếu...thì".',
      whenToUse:
        'Sử dụng khi phát biểu một điều kiện và kết quả hoặc hậu quả của nó.',
      commonMistakes:
        '就 đôi khi có thể bỏ qua nhưng tốt hơn nên giữ để rõ nghĩa.',
    },

    // 一边...一边... translations
    {
      grammarPatternId: createdPatterns.find(
        (p) => p.pattern === '一边...一边...',
      )?.id,
      language: 'en',
      title: 'Simultaneous Actions 一边...一边... (yībiān...yībiān...)',
      explanation: 'Used to describe two actions happening at the same time.',
      whenToUse: 'Use when describing doing two things simultaneously.',
      commonMistakes:
        "Both actions must be able to happen at the same time. Don't use for sequential actions.",
    },
    {
      grammarPatternId: createdPatterns.find(
        (p) => p.pattern === '一边...一边...',
      )?.id,
      language: 'vn',
      title: 'Hành động đồng thời 一边...一边... (yībiān...yībiān...)',
      explanation: 'Dùng để mô tả hai hành động xảy ra cùng lúc.',
      whenToUse: 'Sử dụng khi mô tả việc làm hai việc cùng một lúc.',
      commonMistakes:
        'Cả hai hành động phải có thể xảy ra cùng lúc. Không dùng cho hành động tuần tự.',
    },

    // 越来越... translations
    {
      grammarPatternId: createdPatterns.find((p) => p.pattern === '越来越...')
        ?.id,
      language: 'en',
      title: 'Progressive Change 越来越... (yuèláiyuè...)',
      explanation:
        'Used to express "more and more" or gradual change/increase.',
      whenToUse:
        'Use when describing a gradual change or increasing intensity of something.',
      commonMistakes:
        'Can only be used with adjectives or certain verbs that express states.',
    },
    {
      grammarPatternId: createdPatterns.find((p) => p.pattern === '越来越...')
        ?.id,
      language: 'vn',
      title: 'Thay đổi dần dần 越来越... (yuèláiyuè...)',
      explanation: 'Dùng để diễn đạt "ngày càng" hoặc sự thay đổi/tăng dần.',
      whenToUse:
        'Sử dụng khi mô tả sự thay đổi dần dần hoặc cường độ tăng dần của cái gì đó.',
      commonMistakes:
        'Chỉ có thể dùng với tính từ hoặc một số động từ biểu thị trạng thái.',
    },

    // More translations for other patterns...
    {
      grammarPatternId: createdPatterns.find(
        (p) => p.pattern === '虽然...但是...',
      )?.id,
      language: 'en',
      title: 'Concessive Pattern 虽然...但是... (suīrán...dànshì...)',
      explanation:
        'Used to express "although...but" to show contrast or concession.',
      whenToUse:
        'Use when acknowledging one fact while presenting a contrasting fact.',
      commonMistakes:
        'In English we don\'t use "but" after "although", but in Chinese both parts are needed.',
    },
    {
      grammarPatternId: createdPatterns.find((p) => p.pattern === '把...V了')
        ?.id,
      language: 'en',
      title: 'Object Disposal 把...V了 (bǎ...V le)',
      explanation: 'Used to emphasize the object and what happened to it.',
      whenToUse:
        'Use when the action causes a change to the object or moves it somewhere.',
      commonMistakes:
        'The object must be specific/definite. The verb cannot stand alone after 把.',
    },
    {
      grammarPatternId: createdPatterns.find((p) => p.pattern === '被...V了')
        ?.id,
      language: 'en',
      title: 'Passive Voice 被...V了 (bèi...V le)',
      explanation:
        'Used to form passive voice, often with negative connotations.',
      whenToUse:
        'Use when the subject receives the action rather than performing it.',
      commonMistakes:
        'Often implies something undesirable happened. The agent (doer) can be omitted.',
    },
    {
      grammarPatternId: createdPatterns.find((p) => p.pattern === '连...都...')
        ?.id,
      language: 'en',
      title: 'Emphasis Pattern 连...都... (lián...dōu...)',
      explanation: 'Used to emphasize an extreme example, meaning "even".',
      whenToUse:
        'Use when giving an extreme or unexpected example to prove a point.',
      commonMistakes:
        'The thing after 连 should be the most extreme or unexpected example.',
    },
  ];

  // Create translations
  for (const translationData of translationsData) {
    if (translationData.grammarPatternId) {
      try {
        await grammarTranslationsService.create({
          ...translationData,
          grammarPatternId: translationData.grammarPatternId,
        });
        console.log(
          `✅ Created translation: ${translationData.title} (${translationData.language})`,
        );
      } catch {
        console.log(
          `⚠️ Translation ${translationData.title} (${translationData.language}) might already exist`,
        );
      }
    }
  }

  console.log('🎉 Grammar seeding completed!');
  console.log(`📊 Summary:`);
  console.log(`   - Grammar patterns: ${createdPatterns.length}`);
  console.log(
    `   - Translations: ${translationsData.filter((t) => t.grammarPatternId).length} attempted`,
  );

  await app.close();
}

seed().catch((error) => {
  console.error('❌ Grammar seeding failed:', error);
  process.exit(1);
});
