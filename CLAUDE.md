# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Chinese Language Learning Backend** built with **NestJS 11.x** and **TypeScript 5.7**, using **MySQL** as the database with **TypeORM 0.3.25** for ORM. The application provides a comprehensive API for managing Chinese language learning content including words, grammar patterns, lessons, courses, and user authentication.

## Development Commands

### Essential Development Commands
```bash
npm run start:dev      # Development with watch mode (primary development command)
npm run build          # Build the application
npm run lint           # ESLint with auto-fix
npm run format         # Prettier code formatting
npm run test           # Unit tests with Jest
npm run test:watch     # Unit tests in watch mode
npm run test:cov       # Unit tests with coverage
npm run test:e2e       # End-to-end tests
```

### Data Seeding Commands
```bash
npm run seed:words                    # Seed word dictionary data
npm run seed:grammar                  # Seed grammar patterns
npm run seed:lessons                  # Seed lesson content (basic)
npm run seed:lessons:comprehensive    # Seed comprehensive lesson content
npm run verify:lessons               # Verify lesson data integrity
```

### Environment Setup
- Copy `.env.example` to `.env` and configure database credentials
- Database auto-creates via TypeORM synchronization (synchronize: true)
- Default configuration: MySQL on localhost:3306, database: `cn_db_v1`
- RAG services: Configure EMBEDDING_SERVICE_URL and LLM_SERVICE_URL for AI features
- AWS S3: Set up credentials for file storage capabilities

## Architecture Overview

### Core Technology Stack
- **NestJS**: Main framework with decorator-based architecture
- **TypeORM**: Auto-synchronization enabled, uses JSON columns for flexible content
- **JWT + Passport**: Authentication with role-based access (Admin/User)
- **MySQL**: Primary database with JSON data fields for lesson content

### Module Structure
```
src/modules/
├── auth/              # JWT authentication system
├── users/             # User management with HSK levels and study tracking
├── courses/           # Course structure with prerequisites
├── lessons/           # Lesson metadata and content management
├── words/             # Chinese word management with simplified forms
├── grammar/           # Grammar pattern management
└── rag/               # RAG (Retrieval-Augmented Generation) AI services
```

### Key Architectural Decisions

1. **JSON Data Storage**: Lessons use MySQL JSON columns for flexible content and questions data
2. **Role-Based Authorization**: All endpoints require either Admin or User role via JWT
3. **Auto-Schema Management**: TypeORM synchronize: true for rapid development
4. **Modular Design**: Each learning content type has its own dedicated module
5. **Combined APIs**: `/lessons/content/:id` provides complete lesson data (content + questions)

### Database Entities Architecture
- **Users**: Profile management with HSK levels and study streaks
- **Courses/Lessons**: Hierarchical course structure with lesson prerequisites
- **Contents/Questions**: Flexible JSON storage for lesson materials with order indexing
- **Words/WordSenses/WordSenseTranslations**: Multi-language word management
- **GrammarPatterns/GrammarTranslations**: Grammar rule system
- **Embeddings/RagContext**: Vector storage for AI-powered content search and retrieval
- **UserLessonProgress**: Tracks completion status and learning analytics

### Authentication Flow
- JWT tokens required for all protected endpoints
- Role-based guards enforce Admin vs User permissions
- Admin role: Full CRUD access to all learning content
- User role: Read access to learning materials

### API Patterns
- RESTful endpoints with standard HTTP methods
- Global validation pipes with class-validator/class-transformer
- Comprehensive DTOs for request validation
- CORS enabled for cross-origin requests

### Testing Setup
- Jest for unit tests
- Supertest for e2e tests
- Postman collections available for manual testing

### Important Files
- `main.ts`: Application entry point with global configuration and Swagger setup
- `app.module.ts`: Root module with all feature modules and TypeORM configuration
- Environment variables in `.env` for database, JWT, and external service configuration

### API Documentation
- Swagger UI available at `/api` endpoint when running the server
- Comprehensive API documentation with authentication requirements
- Bearer token authentication required for protected endpoints

### Content Architecture
- **Content Types**: Flexible content system with JSON data storage
- **Question Types**: Interactive questions with various formats (multiple choice, fill-in-the-blank, etc.)
- **Order Indexing**: Content and questions have explicit ordering within lessons
- **RAG Integration**: AI-powered content retrieval and generation capabilities