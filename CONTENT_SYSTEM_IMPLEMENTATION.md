# Content System Implementation

## Overview
This document outlines the implementation of the Content and Questions system for lessons, allowing flexible lesson content management using JSON data structures.

## Database Schema

### Tables Created

1. **Contents Table** (`contents`)
   - `id` (Primary Key)
   - `lesson_id` (Foreign Key to lessons)
   - `order_index` (Integer for ordering)
   - `type` (Enum: content_word_definition, content_sentences)
   - `data` (JSON field for flexible content data)
   - `is_active` (Boolean, default: true)

2. **Questions Table** (`questions`)
   - `id` (Primary Key)
   - `lesson_id` (Foreign Key to lessons)
   - `order_index` (Integer for ordering)
   - `question_type` (Enum: question_audio_image, question_text_selection, question_matching_text, fill_blank, question_audio_bool)
   - `data` (JSON field for flexible question data)
   - `is_active` (Boolean, default: true)

## Files Created

### Entities
- `src/modules/lessons/entities/content.entity.ts` - Content entity with JSON data field
- `src/modules/lessons/entities/question.entity.ts` - Question entity with JSON data field

### Enums
- `src/modules/lessons/enums/content-type.enum.ts` - Content type enumeration
- `src/modules/lessons/enums/question-type.enum.ts` - Question type enumeration

### DTOs
- `src/modules/lessons/dto/create-content.dto.ts` - DTO for creating content
- `src/modules/lessons/dto/update-content.dto.ts` - DTO for updating content
- `src/modules/lessons/dto/create-question.dto.ts` - DTO for creating questions
- `src/modules/lessons/dto/update-question.dto.ts` - DTO for updating questions

### Services
- `src/modules/lessons/content.service.ts` - Content CRUD operations
- `src/modules/lessons/questions.service.ts` - Questions CRUD operations

### Controllers
- `src/modules/lessons/content.controller.ts` - Content API endpoints
- `src/modules/lessons/questions.controller.ts` - Questions API endpoints

## Files Modified

### Core Module Files
- `src/modules/lessons/lessons.module.ts` - Added new entities, services, and controllers
- `src/modules/lessons/lessons.service.ts` - Added complete lesson data fetching logic
- `src/modules/lessons/lessons.controller.ts` - Added `/lessons/content/:id` endpoint
- `src/app.module.ts` - Added new entities to TypeORM configuration

### Dependencies
- Added `@nestjs/mapped-types` package for DTO inheritance

## API Endpoints

### Content Endpoints
- `POST /content` - Create new content
- `GET /content` - Get all content
- `GET /content/lesson/:lessonId` - Get content by lesson ID
- `GET /content/:id` - Get specific content
- `PATCH /content/:id` - Update content
- `DELETE /content/:id` - Soft delete content
- `DELETE /content/:id/hard` - Hard delete content

### Questions Endpoints
- `POST /questions` - Create new question
- `GET /questions` - Get all questions
- `GET /questions/lesson/:lessonId` - Get questions by lesson ID
- `GET /questions/:id` - Get specific question
- `PATCH /questions/:id` - Update question
- `DELETE /questions/:id` - Soft delete question
- `DELETE /questions/:id/hard` - Hard delete question

### Complete Lesson Endpoint
- `GET /lessons/content/:id` - Get complete lesson with content and questions combined and sorted by order_index

## Data Structure Example

The complete lesson API (`GET /lessons/content/:id`) returns data in the format matching your sampleAPI.json:

```json
{
  "id": 2,
  "name": "Lesson Name",
  "description": "Lesson Description",
  "content": [
    {
      "order_index": 1,
      "question_type": "content_word_definition",
      "chinese_text": "家",
      "pinyin": "jiā",
      "part_of_speech": "số lượng từ",
      // ... other data from JSON field
    },
    {
      "order_index": 2,
      "question_type": "question_audio_image",
      "audio_url": "example.url",
      "answers": [...],
      // ... other data from JSON field
    }
  ]
}
```

## Benefits

1. **Flexibility**: JSON fields allow for different question types without schema changes
2. **No Redundancy**: Single table per entity type with JSON for variable data
3. **Scalability**: Easy to add new content/question types
4. **Maintainability**: Clean separation of concerns with dedicated services and controllers
5. **API Compatibility**: Complete lesson endpoint matches existing API structure

## Testing

The implementation has been compiled successfully and is ready for testing. The database schema will be automatically created when the application starts due to TypeORM's `synchronize: true` setting.