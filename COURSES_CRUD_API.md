# Courses CRUD API Documentation

This API provides comprehensive course management functionality with admin-only access.

## Authentication

All endpoints require a valid JWT token with **Admin** role in the Authorization header:

```
Authorization: Bearer <admin-jwt-token>
```

## Course Entity Structure

```json
{
  "id": 1,
  "hskLevel": 1,
  "title": "HSK 1 - Basic Chinese Characters",
  "description": "Introduction to basic Chinese characters and pronunciation",
  "totalLessons": 20,
  "prerequisiteCourseId": null,
  "isActive": true,
  "orderIndex": 1,
  "createdAt": "2025-08-11T10:00:00Z",
  "prerequisiteCourse": null
}
```

## Endpoints

### Course Management

#### Create Course

- **POST** `/courses`
- **Roles**: Admin only
- **Description**: Create a new course
- **Body**:

```json
{
  "hskLevel": 1,
  "title": "HSK 1 - Basic Chinese Characters",
  "description": "Introduction to basic Chinese characters and pronunciation",
  "totalLessons": 20,
  "prerequisiteCourseId": null,
  "isActive": true,
  "orderIndex": 1
}
```

- **Validation**:
  - `hskLevel`: Required, must be valid HSK level (1-9)
  - `title`: Required, non-empty string
  - `description`: Optional string
  - `totalLessons`: Optional, defaults to 0
  - `prerequisiteCourseId`: Optional, must reference existing course
  - `isActive`: Optional, defaults to true
  - `orderIndex`: Required, must be unique positive integer

#### Get All Courses (Paginated)

- **GET** `/courses`
- **Roles**: Admin only
- **Description**: Get all courses with pagination and filtering
- **Query Parameters**:
  - `page`: number (default: 1)
  - `limit`: number (default: 10)
  - `hskLevel`: HSK level (1-9, optional)
  - `isActive`: boolean (optional)
  - `prerequisiteCourseId`: number (optional)
- **Response**:

```json
{
  "courses": [Course[]],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

#### Get Course by ID

- **GET** `/courses/:id`
- **Roles**: Admin only
- **Description**: Get a specific course by ID with prerequisite information
- **Response**: Course object with related prerequisite course

#### Get Courses by HSK Level

- **GET** `/courses/hsk/:level`
- **Roles**: Admin only
- **Description**: Get all active courses for a specific HSK level
- **Parameters**: `level` - HSK level (1-9)
- **Response**: Array of courses ordered by orderIndex

#### Update Course

- **PUT** `/courses/:id`
- **Roles**: Admin only
- **Description**: Update course information
- **Body**: Same as create course, but all fields optional
- **Validation**:
  - Cannot set course as its own prerequisite
  - Order index must be unique if changed
  - Prerequisite course must exist if specified

#### Soft Delete Course

- **DELETE** `/courses/:id`
- **Roles**: Admin only
- **Description**: Soft delete course (sets isActive to false)
- **Response**: 204 No Content
- **Validation**: Cannot delete if course is a prerequisite for other courses

#### Hard Delete Course

- **DELETE** `/courses/:id/hard`
- **Roles**: Admin only
- **Description**: Permanently delete course from database
- **Response**: 204 No Content
- **⚠️ Warning**: This action is irreversible
- **Validation**: Cannot delete if course is a prerequisite for other courses

#### Restore Course

- **PUT** `/courses/:id/restore`
- **Roles**: Admin only
- **Description**: Restore a soft-deleted course (sets isActive to true)
- **Response**: Updated course object

#### Get Course Statistics

- **GET** `/courses/stats`
- **Roles**: Admin only
- **Description**: Get course statistics and metrics
- **Response**:

```json
{
  "totalCourses": 25,
  "activeCourses": 23,
  "inactiveCourses": 2,
  "coursesByLevel": {
    "1": 5,
    "2": 4,
    "3": 3,
    "4": 3,
    "5": 2,
    "6": 2,
    "7": 2,
    "8": 1,
    "9": 1
  }
}
```

## Business Rules

### Course Dependencies

- **Prerequisite Validation**: A course can have at most one prerequisite course
- **Circular Dependencies**: Courses cannot be their own prerequisite
- **Deletion Protection**: Cannot delete courses that are prerequisites for other courses

### Order Management

- **Unique Order Index**: Each course must have a unique orderIndex
- **Sequential Ordering**: Courses are displayed in order by HSK level, then by orderIndex

### HSK Level System

- **Supported Levels**: HSK 1-9 (including future expansion levels 7-9)
- **Level Progression**: Courses should generally follow HSK level progression

## Error Responses

All endpoints return appropriate HTTP status codes:

- **200**: Success
- **201**: Created
- **204**: No Content
- **400**: Bad Request (validation errors, business rule violations)
- **401**: Unauthorized (invalid/missing token)
- **403**: Forbidden (non-admin access)
- **404**: Not Found
- **409**: Conflict (duplicate order index)

Example error response:

```json
{
  "statusCode": 400,
  "message": "Order index already exists",
  "error": "Bad Request"
}
```

## Usage Examples

### Create a Course

```bash
curl -X POST http://localhost:3000/courses \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "hskLevel": 1,
    "title": "HSK 1 - Basic Greetings",
    "description": "Learn basic Chinese greetings and introductions",
    "totalLessons": 15,
    "orderIndex": 1
  }'
```

### Get Courses with Filtering

```bash
curl -X GET "http://localhost:3000/courses?hskLevel=1&page=1&limit=5" \
  -H "Authorization: Bearer <admin-token>"
```

### Update Course

```bash
curl -X PUT http://localhost:3000/courses/1 \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "HSK 1 - Updated Title",
    "totalLessons": 18
  }'
```

### Get Course Statistics

```bash
curl -X GET http://localhost:3000/courses/stats \
  -H "Authorization: Bearer <admin-token>"
```
