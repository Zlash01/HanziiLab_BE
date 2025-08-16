# Words Dictionary System

## Overview

This system provides a comprehensive Chinese dictionary management system with three main entities:

1. **Words** - Chinese words with simplified/traditional forms
2. **Word Senses** - Different meanings of the same word
3. **Word Sense Translations** - Translations of each meaning into different languages

## Database Schema

### Tables Created

- `words` - Basic word information
- `word_senses` - Different meanings/senses of words
- `word_sense_translations` - Translations for each sense

### Key Features

- **Hierarchical Structure**: Words → Senses → Translations
- **Multi-language Support**: Translations in multiple languages (en, vn, th, etc.)
- **HSK Level Integration**: Words tagged with HSK difficulty levels
- **Part of Speech**: Grammatical classification (verb, noun, etc.)
- **Usage Context**: Formal, casual, technical contexts
- **Example Contexts**: Real usage examples in Chinese

## API Endpoints

### Authentication & Authorization

- **Users**: Can access all GET endpoints (read-only)
- **Admins**: Can access all endpoints (full CRUD)

### Word Management

- `GET /words` - List words with filtering/pagination
- `GET /words/{id}` - Get specific word with all senses
- `GET /words/simplified/{simplified}` - Find word by Chinese characters
- `POST /words` - Create new word (Admin only)
- `PUT /words/{id}` - Update word (Admin only)
- `DELETE /words/{id}` - Delete word (Admin only)
- `GET /words/stats` - Word statistics (Admin only)

### Word Sense Management

- `GET /word-senses` - List senses with filtering
- `GET /word-senses/{id}` - Get specific sense
- `GET /word-senses/by-word/{wordId}` - Get all senses for a word
- `POST /word-senses` - Create new sense (Admin only)
- `PUT /word-senses/{id}` - Update sense (Admin only)
- `DELETE /word-senses/{id}` - Delete sense (Admin only)
- `GET /word-senses/stats` - Sense statistics (Admin only)

### Translation Management

- `GET /word-sense-translations` - List translations
- `GET /word-sense-translations/{id}` - Get specific translation
- `GET /word-sense-translations/by-word-sense/{wordSenseId}` - Get translations for a sense
- `GET /word-sense-translations/by-language/{language}` - Get translations by language
- `POST /word-sense-translations` - Create translation (Admin only)
- `PUT /word-sense-translations/{id}` - Update translation (Admin only)
- `DELETE /word-sense-translations/{id}` - Delete translation (Admin only)
- `GET /word-sense-translations/stats` - Translation statistics (Admin only)

## Example Data Structure

```json
{
  "word": {
    "id": 1,
    "simplified": "打",
    "traditional": "打",
    "isCompound": false,
    "characterCount": 1,
    "senses": [
      {
        "id": 1,
        "senseNumber": 1,
        "pinyin": "dǎ",
        "partOfSpeech": "verb",
        "hskLevel": 2,
        "usageContext": "sports",
        "isPrimary": true,
        "exampleContext": "打球",
        "translations": [
          {
            "language": "en",
            "translation": "to play (sports)",
            "usageNotes": "Used for ball games and sports"
          },
          {
            "language": "vn",
            "translation": "chơi (thể thao)",
            "usageNotes": "Dùng cho các môn thể thao bóng"
          }
        ]
      },
      {
        "id": 2,
        "senseNumber": 2,
        "pinyin": "dǎ",
        "partOfSpeech": "verb",
        "hskLevel": 2,
        "usageContext": "communication",
        "isPrimary": false,
        "exampleContext": "打电话",
        "translations": [
          {
            "language": "en",
            "translation": "to make (a phone call)",
            "usageNotes": "Specifically for making phone calls"
          }
        ]
      }
    ]
  }
}
```

## Seeding Data

### Run the Seed Script

```bash
npm run seed:words
```

This will populate the database with sample Chinese words including:

- 你好 (Hello)
- 我 (I/me)
- 打 (play/hit/make phone call)
- 电话 (telephone)
- 中文 (Chinese language)
- 学习 (study/learn)
- 吃 (eat)
- 饭 (rice/meal)
- 水 (water)
- 喝 (drink)

Each word includes multiple senses and translations in English and Vietnamese.

## Benefits

1. **Scalable Dictionary**: Can handle complex words with multiple meanings
2. **Multi-language Learning**: Supports learners from different language backgrounds
3. **HSK Integration**: Aligned with HSK curriculum standards
4. **Rich Metadata**: Part of speech, usage context, examples
5. **User-friendly API**: Both students and admins can access appropriate data
6. **Data Integrity**: Proper foreign key relationships and validation

## Future TODOs

- Add FK relationships to lessons/courses when those tables are created
- Add audio pronunciation fields
- Add stroke order information for characters
- Add frequency/popularity rankings
- Add synonyms and antonyms relationships
- Add word families and etymology information
