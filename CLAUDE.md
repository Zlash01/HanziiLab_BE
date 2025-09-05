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
npm run test:e2e       # End-to-end tests
```

### Environment Setup
- Copy `.env.example` to `.env` and configure database credentials
- Database auto-creates via TypeORM synchronization (synchronize: true)
- Default configuration: MySQL on localhost:3306, database: `cn_db_v1`

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
├── lessons/           # Lesson metadata
├── words/             # Chinese word management with simplified forms
└── grammar/           # Grammar pattern management
```

### Key Architectural Decisions

1. **JSON Data Storage**: Lessons use MySQL JSON columns for flexible content and questions data
2. **Role-Based Authorization**: All endpoints require either Admin or User role via JWT
3. **Auto-Schema Management**: TypeORM synchronize: true for rapid development
4. **Modular Design**: Each learning content type has its own dedicated module
5. **Combined APIs**: `/lessons/content/:id` provides complete lesson data (content + questions)

### Database Entities Architecture
- **Users**: Profile management with HSK levels and study streaks
- **Courses/Lessons**: Hierarchical course structure
- **Contents/Questions**: Flexible JSON storage for lesson materials
- **Words/WordSenses/WordSenseTranslations**: Multi-language word management
- **GrammarPatterns/GrammarTranslations**: Grammar rule system

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
- `main.ts`: Application entry point with global configuration
- `app.module.ts`: Root module with all feature modules
- Environment variables in `.env` for database and JWT configuration