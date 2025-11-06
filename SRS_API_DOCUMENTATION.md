# Spaced Repetition System (SRS) API Documentation

## Overview

The Spaced Repetition System (SRS) is a learning technique that presents educational content at increasing intervals to improve long-term retention. This implementation uses the **SM-2 (SuperMemo 2)** algorithm, the industry standard algorithm used by popular applications like Anki.

### Key Features

- **SM-2 Algorithm**: Proven algorithm for optimal review scheduling
- **Question-Based Reviews**: Tracks individual questions from lessons
- **Hybrid Integration**: Questions become reviewable after lesson completion
- **Automatic Initialization**: Questions are automatically added to review pool upon lesson completion
- **Performance Tracking**: Comprehensive statistics and analytics
- **Flexible Review Management**: Reset, track, and monitor review progress

---

## How It Works

### 1. Lesson Completion Triggers SRS

When a user completes a lesson via `PUT /users/progress/complete`:
1. Lesson is marked as completed in `user_lesson_progress` table
2. **All active questions** from that lesson are automatically initialized for SRS review
3. Each question gets an initial review scheduled for **tomorrow** (1 day interval)
4. Initial SM-2 parameters: `easeFactor: 2.5`, `interval: 1`, `repetitions: 0`

### 2. SM-2 Algorithm Explanation

The SM-2 algorithm adjusts review intervals based on recall quality:

#### Quality Scale (0-5)
- **0**: Complete blackout - No recall at all
- **1**: Incorrect response - But you remembered seeing it
- **2**: Incorrect response - But the correct answer seemed easy to recall
- **3**: Correct response - But recalled with serious difficulty
- **4**: Correct response - After some hesitation
- **5**: Perfect response - Immediate and confident recall

#### Algorithm Formula

```
EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))

Where:
- EF  = Current Ease Factor
- EF' = New Ease Factor
- q   = Quality of recall (0-5)
- Minimum EF is 1.3
```

#### Interval Calculation

**If quality < 3** (Failed recall):
- Reset: `repetitions = 0`, `interval = 1 day`
- Start over from day 1

**If quality ≥ 3** (Successful recall):
- Increment: `repetitions = repetitions + 1`
- **First repetition**: `interval = 1 day`
- **Second repetition**: `interval = 6 days`
- **Subsequent repetitions**: `interval = previous_interval * ease_factor`

### 3. Review Lifecycle

```
[Lesson Completed]
    ↓
[Questions Initialized]
    ↓ (next day)
[Question Due for Review]
    ↓
[User Submits Quality Rating]
    ↓
[SM-2 Calculates Next Interval]
    ↓
[Question Scheduled for Future Review]
```

---

## Database Schema

### `user_question_reviews` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | int (PK) | Primary key |
| `user_id` | int (FK) | References users table |
| `question_id` | int (FK) | References questions table |
| `lesson_id` | int (FK) | References lessons table (denormalized) |
| `ease_factor` | decimal(4,2) | SM-2 ease factor (default 2.5, min 1.3) |
| `interval` | int | Days until next review |
| `repetitions` | int | Consecutive correct answers |
| `next_review_date` | timestamp | Date when question is due for review |
| `last_reviewed_at` | timestamp | Last time question was reviewed |
| `created_at` | timestamp | When added to review pool |
| `updated_at` | timestamp | Last update timestamp |

**Indexes:**
- Unique: `[user_id, question_id]`
- Index: `[user_id, next_review_date]` (for efficient due queries)
- Index: `[user_id, lesson_id]` (for lesson stats)

---

## API Endpoints

### Base URL
All SRS endpoints are prefixed with `/srs`

### Authentication
All endpoints require JWT authentication with `User` or `Admin` role.

---

### 1. Get Due Reviews

**GET** `/srs/reviews/due`

Returns all questions that are due for review today or overdue.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:** `200 OK`
```json
[
  {
    "questionId": 1,
    "lessonId": 5,
    "questionType": "question_selection_text_text",
    "data": {
      "prompt": "What is '你好' in English?",
      "choices": ["Hello", "Goodbye", "Thank you", "Sorry"],
      "correctAnswer": 0
    },
    "nextReviewDate": "2025-01-15T00:00:00.000Z",
    "easeFactor": 2.5,
    "interval": 1,
    "repetitions": 0
  },
  {
    "questionId": 2,
    "lessonId": 5,
    "questionType": "question_fill_text_text",
    "data": {
      "prompt": "Fill in the blank: 我_____学生",
      "correctAnswer": "是"
    },
    "nextReviewDate": "2025-01-14T00:00:00.000Z",
    "easeFactor": 2.3,
    "interval": 3,
    "repetitions": 2
  }
]
```

**Use Case:**
Call this endpoint to get the daily review queue. Present these questions to the user one by one.

---

### 2. Submit Review Result

**POST** `/srs/reviews/submit`

Submit the quality of recall for a reviewed question. The SM-2 algorithm calculates the next review date.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "questionId": 1,
  "quality": 4
}
```

**Parameters:**
- `questionId` (number, required): ID of the question being reviewed
- `quality` (number, required): Quality of recall (0-5)

**Response:** `200 OK`
```json
{
  "message": "Review submitted successfully",
  "nextReviewDate": "2025-01-22T00:00:00.000Z",
  "interval": 7,
  "easeFactor": 2.6,
  "repetitions": 3
}
```

**Error Responses:**

**400 Bad Request** - Invalid quality value
```json
{
  "statusCode": 400,
  "message": "Quality must be between 0 and 5"
}
```

**404 Not Found** - Question not in review pool
```json
{
  "statusCode": 404,
  "message": "Review record not found for question 1. Make sure the lesson is completed first."
}
```

---

### 3. Get Upcoming Reviews

**GET** `/srs/reviews/upcoming`

Returns the review schedule for the next 30 days.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:** `200 OK`
```json
[
  {
    "date": "2025-01-16",
    "count": 15
  },
  {
    "date": "2025-01-17",
    "count": 8
  },
  {
    "date": "2025-01-20",
    "count": 23
  }
]
```

**Use Case:**
Display a calendar view showing the user's upcoming review workload.

---

### 4. Get Overall Review Statistics

**GET** `/srs/stats`

Returns comprehensive statistics about the user's SRS progress.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:** `200 OK`
```json
{
  "total": 150,
  "due": 25,
  "learning": 40,
  "mature": 110,
  "averageEaseFactor": 2.45
}
```

**Fields:**
- `total`: Total questions in review pool
- `due`: Questions due today or overdue
- `learning`: Questions with < 3 consecutive correct answers
- `mature`: Questions with ≥ 3 consecutive correct answers
- `averageEaseFactor`: Average ease factor across all questions

**Use Case:**
Display dashboard statistics showing user's overall SRS performance.

---

### 5. Get Lesson Review Statistics

**GET** `/srs/stats/lesson/:lessonId`

Returns statistics for questions from a specific lesson.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Path Parameters:**
- `lessonId` (number, required): Lesson ID

**Response:** `200 OK`
```json
{
  "lessonId": 5,
  "lessonName": "Introduction to Greetings",
  "totalQuestions": 10,
  "dueQuestions": 3,
  "averageEaseFactor": 2.6
}
```

**Use Case:**
Show per-lesson review progress in lesson detail pages.

---

### 6. Reset Question Review

**DELETE** `/srs/reviews/:questionId/reset`

Reset a question's review parameters back to initial values. Useful for testing or if user wants to restart.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Path Parameters:**
- `questionId` (number, required): Question ID

**Response:** `200 OK`
```json
{
  "message": "Question review reset successfully"
}
```

**Post-Reset Values:**
- `easeFactor`: 2.5
- `interval`: 1 day
- `repetitions`: 0
- `nextReviewDate`: Tomorrow

**Error Response:**

**404 Not Found**
```json
{
  "statusCode": 404,
  "message": "Review record not found for question 123"
}
```

---

## Integration with Lesson System

### Enhanced Lesson Content Endpoint

**GET** `/lessons/content/:id`

The lesson content endpoint has been enhanced to include words and grammar patterns.

**Response:**
```json
{
  "id": 1,
  "name": "Introduction to Greetings",
  "description": "Learn basic Chinese greetings",
  "content": [
    {
      "id": 1,
      "itemType": "content",
      "orderIndex": 1,
      "type": "text",
      "isActive": true,
      "data": { "text": "Welcome to lesson 1..." }
    },
    {
      "id": 5,
      "itemType": "question",
      "orderIndex": 2,
      "type": "question_selection_text_text",
      "isActive": true,
      "data": {
        "prompt": "What is '你好'?",
        "choices": ["Hello", "Goodbye"]
      }
    }
  ],
  "words": [
    {
      "id": 1,
      "lessonId": 1,
      "wordSenseId": 10,
      "isPrimary": true,
      "orderIndex": 1,
      "wordSense": {
        "id": 10,
        "simplified": "你好",
        "pinyin": "nǐ hǎo",
        "word": { /* word details */ }
      }
    }
  ],
  "grammarPatterns": [
    {
      "id": 1,
      "lessonId": 1,
      "grammarPatternId": 5,
      "isPrimary": true,
      "orderIndex": 1,
      "grammarPattern": {
        "id": 5,
        "pattern": ["Subject", "是", "Noun"],
        /* grammar details */
      }
    }
  ]
}
```

---

## Usage Flow Example

### Complete User Flow

1. **Student completes a lesson**
   ```http
   PUT /users/progress/complete
   {
     "lessonId": 5,
     "scorePercentage": 85
   }
   ```
   - Lesson marked complete
   - All 10 questions from lesson 5 automatically added to SRS pool
   - Questions scheduled for review tomorrow

2. **Next day: Check due reviews**
   ```http
   GET /srs/reviews/due
   ```
   - Returns 10 questions from yesterday's completed lesson

3. **Student reviews each question**
   ```http
   POST /srs/reviews/submit
   {
     "questionId": 1,
     "quality": 5  // Perfect recall
   }
   ```
   - Question scheduled for 6 days later
   - Ease factor adjusted to 2.6

4. **6 days later: Question appears again**
   - Student answers with quality 4
   - Next interval: 6 * 2.6 = 15.6 ≈ 16 days

5. **Check statistics**
   ```http
   GET /srs/stats
   ```
   - View overall progress

---

## Best Practices

### For Frontend Developers

1. **Daily Review Habit**
   - Show due count on dashboard
   - Send notifications for due reviews
   - Gamify with streaks and achievements

2. **Review Session UX**
   - Fetch all due reviews at session start
   - Show progress (e.g., "5/25 completed")
   - Allow quality rating with keyboard shortcuts (0-5)
   - Show immediate feedback on next review date

3. **Statistics Display**
   - Dashboard widget with due count
   - Calendar heatmap for upcoming reviews
   - Per-lesson progress indicators
   - Learning vs mature card ratio

4. **Error Handling**
   - Handle 404 if question not in pool yet
   - Validate quality input (0-5)
   - Graceful degradation if SRS unavailable

### For Backend Developers

1. **Performance Optimization**
   - Indexes on `[userId, nextReviewDate]` for fast due queries
   - Batch initialization of questions
   - Cache statistics queries

2. **Data Integrity**
   - Unique constraint on `[userId, questionId]`
   - Cascade deletes for user/question deletion
   - Transaction handling for lesson completion

3. **Monitoring**
   - Log SRS initialization failures
   - Track average ease factors
   - Monitor review submission rates

---

## Advanced Topics

### Customizing the Algorithm

The SM-2 algorithm can be tuned by modifying `calculateNextReview()` in `srs.service.ts`:

- **Ease Factor Sensitivity**: Adjust the formula coefficients
- **Minimum Ease Factor**: Change from 1.3 to prevent overly easy cards
- **Initial Intervals**: Modify 1-day and 6-day intervals for first two repetitions
- **Quality Threshold**: Change quality < 3 threshold for failure

### Extending the System

Potential enhancements:

1. **Leech Detection**: Flag questions failed repeatedly
2. **Graduated Intervals**: Different paths for easy vs hard cards
3. **Review History**: Store all review attempts for analytics
4. **Tags and Filtering**: Review specific topics
5. **Shared Decks**: Community-created question sets
6. **Cram Mode**: Temporary review of specific lessons

---

## Troubleshooting

### Questions Not Appearing in Reviews

**Problem**: User completed lesson but no reviews due

**Solutions:**
- Check if lesson was marked as completed: `GET /users/progress/lesson/:lessonId`
- Verify questions exist: `GET /lessons/content/:id`
- Check if questions are active: `isActive: true`
- Look for SRS initialization errors in server logs

### Review Dates Not Calculating Correctly

**Problem**: Next review date seems wrong

**Debug Steps:**
1. Check current ease factor and repetitions
2. Verify quality was in 0-5 range
3. Test SM-2 calculation manually
4. Check for timezone issues (dates stored as UTC)

### Performance Issues

**Problem**: Slow query for due reviews

**Solutions:**
- Verify index on `[userId, nextReviewDate]`
- Limit due reviews query to current day only
- Consider pagination for large review queues
- Cache statistics with TTL

---

## Testing

### Manual Testing Checklist

- [ ] Complete a lesson → Questions initialized
- [ ] Next day → Questions appear in due reviews
- [ ] Submit quality 5 → Next review in 6 days
- [ ] Submit quality 2 → Review resets to 1 day
- [ ] Check statistics → Counts are accurate
- [ ] Reset a question → Returns to initial state
- [ ] View upcoming reviews → Calendar populated

### API Testing with cURL

**Get due reviews:**
```bash
curl -X GET http://localhost:3000/srs/reviews/due \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Submit review:**
```bash
curl -X POST http://localhost:3000/srs/reviews/submit \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"questionId": 1, "quality": 4}'
```

**Get stats:**
```bash
curl -X GET http://localhost:3000/srs/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## References

- **SM-2 Algorithm**: [SuperMemo SM-2 Documentation](https://www.supermemo.com/en/archives1990-2015/english/ol/sm2)
- **Spaced Repetition**: [Wikipedia - Spaced Repetition](https://en.wikipedia.org/wiki/Spaced_repetition)
- **Anki Manual**: [Anki SRS Guide](https://docs.ankiweb.net/studying.html)

---

## Support

For issues, feature requests, or questions:
- Check server logs for SRS initialization errors
- Verify database migrations ran successfully
- Review Swagger documentation at `/api` endpoint
- Contact backend team for algorithm customization

---

**Version**: 1.0.0
**Last Updated**: 2025-01-15
**Maintainer**: Backend Team
