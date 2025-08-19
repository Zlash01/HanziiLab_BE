# Sentences System

This document describes the sentences system that has been implemented for the Chinese learning application.

## Overview

The sentences system provides functionality to manage Chinese sentences with their translations and token breakdowns. It includes three main entities:

1. **Sentences** - The main sentences with Chinese text, pinyin, and metadata
2. **Sentence Translations** - Translations of sentences in different languages
3. **Sentence Tokens** - Word-by-word breakdown of sentences for interactive learning

## Database Tables

### sentences

- `id` (Primary Key)
- `chinese_text` (TEXT) - The Chinese sentence
- `pinyin` (TEXT) - Pinyin pronunciation
- `audio_url` (VARCHAR) - Optional audio file URL
- `sentence_type` (ENUM) - Type: example, exercise, dialogue
- `difficulty_level` (INT) - Level 1-5
- `created_at` (TIMESTAMP)

### sentence_translations

- `id` (Primary Key)
- `sentence_id` (Foreign Key to sentences)
- `language` (VARCHAR) - Language code (en, vn, etc.)
- `translation` (TEXT) - Translated sentence
- `literal_translation` (TEXT) - Word-by-word translation
- Unique constraint on (sentence_id, language)

### sentence_tokens

- `id` (Primary Key)
- `sentence_id` (Foreign Key to sentences)
- `position` (INT) - Position in sentence
- `chinese_text` (VARCHAR) - The token text
- `token_type` (ENUM) - Type: word, grammar_particle, grammar_structure, punctuation, number
- `reference_id` (INT) - Reference to word_senses or grammar_patterns
- `is_clickable` (BOOLEAN) - Whether token is interactive
- `highlight_color` (VARCHAR) - Color for highlighting
- Unique constraint on (sentence_id, position)

## API Endpoints

### Sentences Controller (`/sentences`)

**Public Endpoints (authenticated users):**

- `GET /sentences` - Get paginated list of sentences with filters
- `GET /sentences/:id` - Get specific sentence with relations
- `GET /sentences/type/:type` - Get sentences by type
- `GET /sentences/difficulty/:level` - Get sentences by difficulty level

**Admin Only Endpoints:**

- `POST /sentences` - Create new sentence
- `PATCH /sentences/:id` - Update sentence
- `DELETE /sentences/:id` - Delete sentence

### Sentence Translations Controller (`/sentence-translations`)

**Public Endpoints (authenticated users):**

- `GET /sentence-translations` - Get all translations
- `GET /sentence-translations/:id` - Get specific translation
- `GET /sentence-translations/sentence/:sentenceId` - Get all translations for a sentence
- `GET /sentence-translations/sentence/:sentenceId/language/:language` - Get specific translation

**Admin Only Endpoints:**

- `POST /sentence-translations` - Create new translation
- `PATCH /sentence-translations/:id` - Update translation
- `DELETE /sentence-translations/:id` - Delete translation
- `DELETE /sentence-translations/sentence/:sentenceId` - Delete all translations for sentence

### Sentence Tokens Controller (`/sentence-tokens`)

**Public Endpoints (authenticated users):**

- `GET /sentence-tokens` - Get all tokens
- `GET /sentence-tokens/:id` - Get specific token
- `GET /sentence-tokens/sentence/:sentenceId` - Get all tokens for a sentence

**Admin Only Endpoints:**

- `POST /sentence-tokens` - Create new token
- `POST /sentence-tokens/bulk` - Create multiple tokens
- `PATCH /sentence-tokens/:id` - Update token
- `PATCH /sentence-tokens/sentence/:sentenceId/reorder` - Reorder tokens in sentence
- `DELETE /sentence-tokens/:id` - Delete token
- `DELETE /sentence-tokens/sentence/:sentenceId` - Delete all tokens for sentence

## Query Parameters for Sentences

The `GET /sentences` endpoint supports the following query parameters:

- `page` (number) - Page number for pagination (default: 1)
- `limit` (number) - Items per page (default: 10)
- `search` (string) - Search in Chinese text or pinyin
- `sentenceType` (enum) - Filter by sentence type
- `difficultyLevel` (number) - Filter by difficulty level
- `hasAudio` (boolean) - Filter sentences with/without audio

## Enums

### SentenceType

- `EXAMPLE` - Example sentences
- `EXERCISE` - Exercise sentences
- `DIALOGUE` - Dialogue sentences

### TokenType

- `WORD` - Regular vocabulary words
- `GRAMMAR_PARTICLE` - Grammar particles (的, 了, 过, etc.)
- `GRAMMAR_STRUCTURE` - Part of larger grammar pattern
- `PUNCTUATION` - Punctuation marks
- `NUMBER` - Numbers (一, 二, 三, etc.)

## Features

1. **Sentence Management**: Full CRUD operations for sentences
2. **Multi-language Support**: Translations in multiple languages
3. **Token System**: Interactive word-by-word breakdown
4. **Difficulty Levels**: 5-level difficulty system
5. **Audio Support**: Optional audio file URLs
6. **Search & Filter**: Advanced filtering and search capabilities
7. **Role-based Access**: Public read access, admin-only write access

## Usage Examples

### Creating a Sentence

```typescript
POST /sentences
{
  "chineseText": "我喜欢学习中文。",
  "pinyin": "Wǒ xǐhuān xuéxí zhōngwén.",
  "sentenceType": "example",
  "difficultyLevel": 2
}
```

### Adding Translation

```typescript
POST /sentence-translations
{
  "sentenceId": 1,
  "language": "en",
  "translation": "I like learning Chinese.",
  "literalTranslation": "I like study Chinese."
}
```

### Adding Tokens

```typescript
POST / sentence -
  tokens /
    bulk[
      ({
        sentenceId: 1,
        position: 1,
        chineseText: '我',
        tokenType: 'word',
        isClickable: true,
      },
      {
        sentenceId: 1,
        position: 2,
        chineseText: '喜欢',
        tokenType: 'word',
        isClickable: true,
      })
    ];
```

## Files Created

### Entities

- `src/modules/sentences/entities/sentence.entity.ts`
- `src/modules/sentences/entities/sentence-translation.entity.ts`
- `src/modules/sentences/entities/sentence-token.entity.ts`
- `src/modules/sentences/entities/index.ts`

### Enums

- `src/modules/sentences/enums/sentence-type.enum.ts`
- `src/modules/sentences/enums/token-type.enum.ts`

### DTOs

- `src/modules/sentences/dto/create-sentence.dto.ts`
- `src/modules/sentences/dto/update-sentence.dto.ts`
- `src/modules/sentences/dto/get-sentences-query.dto.ts`
- `src/modules/sentences/dto/create-sentence-translation.dto.ts`
- `src/modules/sentences/dto/update-sentence-translation.dto.ts`
- `src/modules/sentences/dto/create-sentence-token.dto.ts`
- `src/modules/sentences/dto/update-sentence-token.dto.ts`

### Services

- `src/modules/sentences/sentences.service.ts`
- `src/modules/sentences/sentence-translations.service.ts`
- `src/modules/sentences/sentence-tokens.service.ts`

### Controllers

- `src/modules/sentences/sentences.controller.ts`
- `src/modules/sentences/sentence-translations.controller.ts`
- `src/modules/sentences/sentence-tokens.controller.ts`

### Module

- `src/modules/sentences/sentences.module.ts`

### Seeding

- `src/seeds/sentences.seed.ts`

## Running the Seed

To populate the database with sample data:

```bash
npm run ts-node src/seeds/sentences.seed.ts
```

The seed will create:

- 5 sample sentences with different types and difficulty levels
- English and Vietnamese translations for each sentence
- Token breakdown for one example sentence

## Integration

The sentences module has been integrated into the main application module (`src/app.module.ts`) and all entities are registered with TypeORM.
