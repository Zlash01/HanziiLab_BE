# Sequence Diagrams

This folder contains PlantUML sequence diagrams documenting the main flows in the HanziiLab Backend API.

## Diagrams Overview

| # | File | Description |
|---|------|-------------|
| 01 | `01-user-registration.puml` | User registration flow with email validation and password hashing |
| 02 | `02-user-login.puml` | User login and JWT token generation |
| 03 | `03-jwt-protected-request.puml` | JWT authentication and role-based authorization flow |
| 04 | `04-lesson-completion.puml` | Lesson completion with SRS initialization and streak update |
| 05 | `05-srs-review-session.puml` | Spaced Repetition System (SM-2 algorithm) review flow |
| 06 | `06-rag-query.puml` | RAG (Retrieval-Augmented Generation) query processing |
| 07 | `07-course-crud.puml` | Course CRUD operations (Admin) |
| 08 | `08-lesson-crud.puml` | Lesson management with words and grammar patterns |
| 09 | `09-word-management.puml` | Word, sense, and translation management |
| 10 | `10-grammar-management.puml` | Grammar pattern and translation management |
| 11 | `11-user-progress-tracking.puml` | User progress and study streak tracking |

## How to View

### VS Code Extension
Install the **PlantUML** extension for VS Code:
1. Open Extensions (Ctrl+Shift+X)
2. Search for "PlantUML"
3. Install the extension by jebbs
4. Open any `.puml` file and press `Alt+D` to preview

### Online Viewer
Copy the content to [PlantUML Online Server](http://www.plantuml.com/plantuml/uml/)

### Generate Images
Using PlantUML CLI:
```bash
# Generate PNG
java -jar plantuml.jar sequence-diagrams/*.puml

# Generate SVG
java -jar plantuml.jar -tsvg sequence-diagrams/*.puml
```

## Flow Categories

### Authentication & Authorization
- `01-user-registration.puml` - New user signup
- `02-user-login.puml` - Login and JWT generation
- `03-jwt-protected-request.puml` - Protected endpoint access

### Learning Progress
- `04-lesson-completion.puml` - Complete a lesson
- `05-srs-review-session.puml` - Spaced repetition reviews
- `11-user-progress-tracking.puml` - Progress and streaks

### Content Management (Admin)
- `07-course-crud.puml` - Course operations
- `08-lesson-crud.puml` - Lesson operations
- `09-word-management.puml` - Word/sense/translation ops
- `10-grammar-management.puml` - Grammar pattern ops

### AI Features
- `06-rag-query.puml` - AI-powered Q&A with RAG

## Key Algorithms Documented

### SM-2 Spaced Repetition (Diagram 05)
The SM-2 algorithm calculates review intervals:
- Quality rating: 0-5 (0=blackout, 5=perfect)
- Ease factor adjustment based on quality
- Interval progression: 1 → 6 → (interval × EF)
- Reset on failed recall (quality < 3)

### Study Streak Logic (Diagram 11)
- Same day: No streak change
- Consecutive day: Increment streak
- Gap > 1 day: Reset streak to 1
- Track longest streak for achievements
