# Words CRUD API Documentation

This API provides comprehensive dictionary management functionality for Chinese words, their senses, and translations.

## Authentication

All endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <jwt-token>
```

- **User role**: Can access GET endpoints
- **Admin role**: Can access all endpoints (GET, POST, PUT, DELETE)

## Entity Structures

### Word Entity

```json
{
  "id": 1,
  "simplified": "打",
  "traditional": "打",
  "isCompound": false,
  "characterCount": 1,
  "createdAt": "2025-08-11T10:00:00Z",
  "senses": [
    {
      "id": 1,
      "senseNumber": 1,
      "pinyin": "dǎ",
      "partOfSpeech": "verb",
      "hskLevel": 2,
      "usageContext": "general",
      "isPrimary": true,
      "exampleContext": "打球",
      "translations": [
        {
          "id": 1,
          "language": "en",
          "translation": "to play (sports), to hit",
          "usageNotes": "Used for sports and physical actions"
        }
      ]
    }
  ]
}
```

### Word Sense Entity

```json
{
  "id": 1,
  "wordId": 1,
  "senseNumber": 1,
  "pinyin": "dǎ",
  "partOfSpeech": "verb",
  "hskLevel": 2,
  "usageContext": "general",
  "isPrimary": true,
  "exampleContext": "打球",
  "word": {
    "id": 1,
    "simplified": "打",
    "traditional": "打"
  },
  "translations": []
}
```

### Word Sense Translation Entity

```json
{
  "id": 1,
  "wordSenseId": 1,
  "language": "en",
  "translation": "to play (sports), to hit",
  "usageNotes": "Used for sports and physical actions",
  "wordSense": {
    "id": 1,
    "pinyin": "dǎ",
    "partOfSpeech": "verb"
  }
}
```

## Words Endpoints

### Get All Words

- **GET** `/words`
- **Roles**: User, Admin
- **Description**: Get paginated list of words with filtering
- **Query Parameters**:
  - `page` (number, optional): Page number (default: 1)
  - `limit` (number, optional): Items per page (default: 10)
  - `search` (string, optional): Search in simplified/traditional characters
  - `characterCount` (number, optional): Filter by character count
  - `isCompound` (boolean, optional): Filter compound words
  - `sortBy` (string, optional): Sort field (default: 'id')
  - `sortOrder` ('ASC'|'DESC', optional): Sort order (default: 'ASC')

**Example Response**:

```json
{
  "words": [
    {
      "id": 1,
      "simplified": "打",
      "traditional": "打",
      "isCompound": false,
      "characterCount": 1,
      "createdAt": "2025-08-11T10:00:00Z",
      "senses": []
    }
  ],
  "total": 1
}
```

### Get Word by ID

- **GET** `/words/{id}`
- **Roles**: User, Admin
- **Description**: Get a specific word with all its senses and translations
- **Path Parameters**:
  - `id` (number): Word ID

### Get Word by Simplified Form

- **GET** `/words/simplified/{simplified}`
- **Roles**: User, Admin
- **Description**: Get a word by its simplified Chinese characters
- **Path Parameters**:
  - `simplified` (string): Simplified Chinese characters

### Create Word

- **POST** `/words`
- **Roles**: Admin only
- **Description**: Create a new word
- **Body**:

```json
{
  "simplified": "打",
  "traditional": "打",
  "isCompound": false,
  "characterCount": 1
}
```

### Update Word

- **PUT** `/words/{id}`
- **Roles**: Admin only
- **Description**: Update an existing word
- **Path Parameters**:
  - `id` (number): Word ID
- **Body** (all fields optional):

```json
{
  "simplified": "打",
  "traditional": "打",
  "isCompound": false,
  "characterCount": 1
}
```

### Delete Word

- **DELETE** `/words/{id}`
- **Roles**: Admin only
- **Description**: Delete a word and all its related senses and translations
- **Path Parameters**:
  - `id` (number): Word ID

### Get Word Statistics

- **GET** `/words/stats`
- **Roles**: Admin only
- **Description**: Get word statistics
- **Response**:

```json
{
  "total": 100,
  "single": 70,
  "compound": 30,
  "characterCounts": [
    { "count": "1", "total": "70" },
    { "count": "2", "total": "25" },
    { "count": "3", "total": "5" }
  ]
}
```

## Word Senses Endpoints

### Get All Word Senses

- **GET** `/word-senses`
- **Roles**: User, Admin
- **Description**: Get paginated list of word senses with filtering
- **Query Parameters**:
  - `page` (number, optional): Page number (default: 1)
  - `limit` (number, optional): Items per page (default: 10)
  - `wordId` (number, optional): Filter by word ID
  - `search` (string, optional): Search in pinyin/example context
  - `hskLevel` (number, optional): Filter by HSK level
  - `partOfSpeech` (string, optional): Filter by part of speech
  - `sortBy` (string, optional): Sort field (default: 'id')
  - `sortOrder` ('ASC'|'DESC', optional): Sort order (default: 'ASC')

### Get Word Sense by ID

- **GET** `/word-senses/{id}`
- **Roles**: User, Admin
- **Description**: Get a specific word sense with translations
- **Path Parameters**:
  - `id` (number): Word sense ID

### Get Word Senses by Word ID

- **GET** `/word-senses/by-word/{wordId}`
- **Roles**: User, Admin
- **Description**: Get all senses for a specific word
- **Path Parameters**:
  - `wordId` (number): Word ID

### Create Word Sense

- **POST** `/word-senses`
- **Roles**: Admin only
- **Description**: Create a new word sense
- **Body**:

```json
{
  "wordId": 1,
  "senseNumber": 1,
  "pinyin": "dǎ",
  "partOfSpeech": "verb",
  "hskLevel": 2,
  "usageContext": "general",
  "isPrimary": true,
  "exampleContext": "打球"
}
```

### Update Word Sense

- **PUT** `/word-senses/{id}`
- **Roles**: Admin only
- **Description**: Update an existing word sense
- **Path Parameters**:
  - `id` (number): Word sense ID
- **Body** (all fields optional):

```json
{
  "senseNumber": 1,
  "pinyin": "dǎ",
  "partOfSpeech": "verb",
  "hskLevel": 2,
  "usageContext": "general",
  "isPrimary": true,
  "exampleContext": "打球"
}
```

### Delete Word Sense

- **DELETE** `/word-senses/{id}`
- **Roles**: Admin only
- **Description**: Delete a word sense and all its translations
- **Path Parameters**:
  - `id` (number): Word sense ID

### Get Word Sense Statistics

- **GET** `/word-senses/stats`
- **Roles**: Admin only
- **Description**: Get word sense statistics
- **Response**:

```json
{
  "total": 150,
  "primary": 100,
  "hskLevelDistribution": [
    { "level": "1", "total": "30" },
    { "level": "2", "total": "40" }
  ],
  "partOfSpeechDistribution": [
    { "pos": "verb", "total": "50" },
    { "pos": "noun", "total": "40" }
  ]
}
```

## Word Sense Translations Endpoints

### Get All Translations

- **GET** `/word-sense-translations`
- **Roles**: User, Admin
- **Description**: Get paginated list of translations with filtering
- **Query Parameters**:
  - `page` (number, optional): Page number (default: 1)
  - `limit` (number, optional): Items per page (default: 10)
  - `wordSenseId` (number, optional): Filter by word sense ID
  - `language` (string, optional): Filter by language code
  - `search` (string, optional): Search in translation/usage notes
  - `sortBy` (string, optional): Sort field (default: 'id')
  - `sortOrder` ('ASC'|'DESC', optional): Sort order (default: 'ASC')

### Get Translation by ID

- **GET** `/word-sense-translations/{id}`
- **Roles**: User, Admin
- **Description**: Get a specific translation
- **Path Parameters**:
  - `id` (number): Translation ID

### Get Translations by Word Sense ID

- **GET** `/word-sense-translations/by-word-sense/{wordSenseId}`
- **Roles**: User, Admin
- **Description**: Get all translations for a specific word sense
- **Path Parameters**:
  - `wordSenseId` (number): Word sense ID

### Get Translations by Language

- **GET** `/word-sense-translations/by-language/{language}`
- **Roles**: User, Admin
- **Description**: Get all translations for a specific language
- **Path Parameters**:
  - `language` (string): Language code (e.g., 'en', 'vn', 'th')

### Create Translation

- **POST** `/word-sense-translations`
- **Roles**: Admin only
- **Description**: Create a new translation
- **Body**:

```json
{
  "wordSenseId": 1,
  "language": "en",
  "translation": "to play (sports), to hit",
  "usageNotes": "Used for sports and physical actions"
}
```

### Update Translation

- **PUT** `/word-sense-translations/{id}`
- **Roles**: Admin only
- **Description**: Update an existing translation
- **Path Parameters**:
  - `id` (number): Translation ID
- **Body** (all fields optional):

```json
{
  "language": "en",
  "translation": "to play (sports), to hit",
  "usageNotes": "Used for sports and physical actions"
}
```

### Delete Translation

- **DELETE** `/word-sense-translations/{id}`
- **Roles**: Admin only
- **Description**: Delete a translation
- **Path Parameters**:
  - `id` (number): Translation ID

### Get Translation Statistics

- **GET** `/word-sense-translations/stats`
- **Roles**: Admin only
- **Description**: Get translation statistics
- **Response**:

```json
{
  "total": 200,
  "languageDistribution": [
    { "language": "en", "total": "150" },
    { "language": "vn", "total": "50" }
  ]
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 403 Forbidden

```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "Word with ID 1 not found",
  "error": "Not Found"
}
```

### 409 Conflict

```json
{
  "statusCode": 409,
  "message": "Word with this simplified form already exists",
  "error": "Conflict"
}
```

## Usage Examples

### Search for words containing "打"

```
GET /words?search=打&page=1&limit=10
```

### Get all verb senses in HSK level 2

```
GET /word-senses?partOfSpeech=verb&hskLevel=2
```

### Get all English translations

```
GET /word-sense-translations/by-language/en
```

### Create a complete word entry (Admin workflow)

1. Create the word:

```
POST /words
{
  "simplified": "新词",
  "traditional": "新詞",
  "isCompound": true,
  "characterCount": 2
}
```

2. Create word senses:

```
POST /word-senses
{
  "wordId": 123,
  "senseNumber": 1,
  "pinyin": "xīn cí",
  "partOfSpeech": "noun",
  "hskLevel": 3,
  "isPrimary": true
}
```

3. Create translations:

```
POST /word-sense-translations
{
  "wordSenseId": 456,
  "language": "en",
  "translation": "new word",
  "usageNotes": "General vocabulary"
}
```
