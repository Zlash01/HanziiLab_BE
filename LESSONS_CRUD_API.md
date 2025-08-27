# Lessons CRUD API

This document describes the CRUD operations available for managing lessons in the Chinese learning platform.

## Endpoints

### Base URL

```
/lessons
```

### Authentication

All endpoints require JWT authentication. Some endpoints require specific roles:

- **Admin**: Full access to all operations
- **User**: Read-only access to lessons

---

## Endpoints Overview

| Method | Endpoint                        | Role Required | Description                                                |
| ------ | ------------------------------- | ------------- | ---------------------------------------------------------- |
| POST   | `/lessons`                      | Admin         | Create a new lesson                                        |
| GET    | `/lessons`                      | Admin, User   | Get all lessons with pagination and filters                |
| GET    | `/lessons/:id`                  | Admin, User   | Get a specific lesson by ID                                |
| GET    | `/lessons/course/:courseId`     | Admin, User   | Get active lessons for a specific course                   |
| GET    | `/lessons/course/:courseId/all` | Admin         | Get all lessons (including inactive) for a specific course |
| PUT    | `/lessons/:id`                  | Admin         | Update a lesson                                            |
| DELETE | `/lessons/:id/soft`             | Admin         | Soft delete a lesson (set isActive = false)                |
| DELETE | `/lessons/:id/hard`             | Admin         | Hard delete a lesson (permanently remove)                  |
| PATCH  | `/lessons/:id/restore`          | Admin         | Restore a soft deleted lesson                              |

---

## Detailed Endpoint Documentation

### 1. Create Lesson

**POST** `/lessons`

**Role Required:** Admin

**Request Body:**

```json
{
  "name": "Lesson 1: Greetings",
  "description": "Learn basic Chinese greetings",
  "isActive": true,
  "orderIndex": 1,
  "courseId": 1
}
```

**Request Body Validation:**

- `name`: Required, string (max 200 characters)
- `description`: Optional, string
- `isActive`: Optional, boolean (default: true)
- `orderIndex`: Required, integer (min: 1)
- `courseId`: Required, integer

**Response:**

```json
{
  "id": 1,
  "name": "Lesson 1: Greetings",
  "description": "Learn basic Chinese greetings",
  "isActive": true,
  "orderIndex": 1,
  "courseId": 1,
  "course": {
    "id": 1,
    "title": "HSK Level 1"
    // ... other course properties
  }
}
```

---

### 2. Get All Lessons

**GET** `/lessons`

**Role Required:** Admin, User

**Query Parameters:**

- `page`: Optional, integer (default: 1, min: 1) - Page number for pagination
- `limit`: Optional, integer (default: 10, min: 1) - Number of items per page
- `courseId`: Optional, integer - Filter lessons by course ID
- `isActive`: Optional, boolean - Filter lessons by active status
- `includeInactive`: Optional, boolean (default: false) - Include inactive lessons in results (Admin only)

**Example Request:**

```
GET /lessons?page=1&limit=10&courseId=1&isActive=true
GET /lessons?page=1&limit=10&includeInactive=true  // Admin only
```

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "name": "Lesson 1: Greetings",
      "description": "Learn basic Chinese greetings",
      "isActive": true,
      "orderIndex": 1,
      "courseId": 1,
      "course": {
        "id": 1,
        "title": "HSK Level 1"
        // ... other course properties
      }
    }
    // ... more lessons
  ],
  "total": 25,
  "page": 1,
  "limit": 10
}
```

---

### 3. Get Lesson by ID

**GET** `/lessons/:id`

**Role Required:** Admin, User

**Parameters:**

- `id`: Required, integer - The lesson ID

**Response:**

```json
{
  "id": 1,
  "name": "Lesson 1: Greetings",
  "description": "Learn basic Chinese greetings",
  "isActive": true,
  "orderIndex": 1,
  "courseId": 1,
  "course": {
    "id": 1,
    "title": "HSK Level 1"
    // ... other course properties
  }
}
```

**Error Response (404):**

```json
{
  "statusCode": 404,
  "message": "Lesson with ID 999 not found"
}
```

---

### 4. Get Lessons by Course ID

**GET** `/lessons/course/:courseId`

**Role Required:** Admin, User

**Parameters:**

- `courseId`: Required, integer - The course ID

**Response:**

```json
[
  {
    "id": 1,
    "name": "Lesson 1: Greetings",
    "description": "Learn basic Chinese greetings",
    "isActive": true,
    "orderIndex": 1,
    "courseId": 1,
    "course": {
      "id": 1,
      "title": "HSK Level 1"
      // ... other course properties
    }
  },
  {
    "id": 2,
    "name": "Lesson 2: Numbers",
    "description": "Learn numbers 1-10",
    "isActive": true,
    "orderIndex": 2,
    "courseId": 1,
    "course": {
      "id": 1,
      "title": "HSK Level 1"
      // ... other course properties
    }
  }
  // ... more lessons ordered by orderIndex
]
```

---

### 5. Get All Lessons by Course ID (Including Inactive)

**GET** `/lessons/course/:courseId/all`

**Role Required:** Admin

**Parameters:**

- `courseId`: Required, integer - The course ID

**Response:**

```json
[
  {
    "id": 1,
    "name": "Lesson 1: Greetings",
    "description": "Learn basic Chinese greetings",
    "isActive": true,
    "orderIndex": 1,
    "courseId": 1,
    "course": {
      "id": 1,
      "title": "HSK Level 1"
    }
  },
  {
    "id": 2,
    "name": "Lesson 2: Numbers",
    "description": "Learn numbers 1-10",
    "isActive": false, // Soft deleted lesson
    "orderIndex": 2,
    "courseId": 1,
    "course": {
      "id": 1,
      "title": "HSK Level 1"
    }
  }
  // ... more lessons including inactive ones
]
```

---

### 6. Update Lesson

**PUT** `/lessons/:id`

**Role Required:** Admin

**Parameters:**

- `id`: Required, integer - The lesson ID

**Request Body (all fields optional):**

```json
{
  "name": "Updated Lesson Name",
  "description": "Updated description",
  "isActive": false,
  "orderIndex": 2,
  "courseId": 2
}
```

**Request Body Validation:**

- `name`: Optional, string (max 200 characters)
- `description`: Optional, string
- `isActive`: Optional, boolean
- `orderIndex`: Optional, integer (min: 1)
- `courseId`: Optional, integer

**Response:**

```json
{
  "id": 1,
  "name": "Updated Lesson Name",
  "description": "Updated description",
  "isActive": false,
  "orderIndex": 2,
  "courseId": 2,
  "course": {
    "id": 2,
    "title": "HSK Level 2"
    // ... other course properties
  }
}
```

**Error Response (404):**

```json
{
  "statusCode": 404,
  "message": "Lesson with ID 999 not found"
}
```

---

### 7. Soft Delete Lesson

**DELETE** `/lessons/:id/soft`

**Role Required:** Admin

**Parameters:**

- `id`: Required, integer - The lesson ID

**Description:** Sets the lesson's `isActive` field to `false`. The lesson is not permanently deleted and can be restored later.

**Response:**

```json
{
  "message": "Lesson soft deleted successfully",
  "lesson": {
    "id": 1,
    "name": "Lesson 1: Greetings",
    "description": "Learn basic Chinese greetings",
    "isActive": false,
    "orderIndex": 1,
    "courseId": 1,
    "course": {
      "id": 1,
      "title": "HSK Level 1"
    }
  }
}
```

**Error Response (404):**

```json
{
  "statusCode": 404,
  "message": "Lesson with ID 999 not found"
}
```

---

### 8. Hard Delete Lesson

**DELETE** `/lessons/:id/hard`

**Role Required:** Admin

**Parameters:**

- `id`: Required, integer - The lesson ID

**Description:** Permanently removes the lesson from the database. This action cannot be undone.

**Response:**

```json
{
  "message": "Lesson permanently deleted successfully"
}
```

**Error Response (404):**

```json
{
  "statusCode": 404,
  "message": "Lesson with ID 999 not found"
}
```

---

### 9. Restore Lesson

**PATCH** `/lessons/:id/restore`

**Role Required:** Admin

**Parameters:**

- `id`: Required, integer - The lesson ID

**Description:** Restores a soft-deleted lesson by setting `isActive` to `true`.

**Response:**

```json
{
  "message": "Lesson restored successfully",
  "lesson": {
    "id": 1,
    "name": "Lesson 1: Greetings",
    "description": "Learn basic Chinese greetings",
    "isActive": true,
    "orderIndex": 1,
    "courseId": 1,
    "course": {
      "id": 1,
      "title": "HSK Level 1"
    }
  }
}
```

**Error Response (404):**

```json
{
  "statusCode": 404,
  "message": "Lesson with ID 999 not found"
}
```

---

## Data Model

### Lesson Entity

```typescript
{
  id: number; // Primary key
  name: string; // Lesson name (max 200 chars)
  description: string; // Lesson description (nullable)
  isActive: boolean; // Whether lesson is active (default: true)
  orderIndex: number; // Order within the course
  courseId: number; // Foreign key to course
  course: Course; // Related course entity
}
```

---

## Error Handling

### Common Error Responses

**400 Bad Request** - Validation errors:

```json
{
  "statusCode": 400,
  "message": [
    "name should not be empty",
    "orderIndex must be a positive number"
  ],
  "error": "Bad Request"
}
```

**401 Unauthorized** - Missing or invalid JWT:

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**403 Forbidden** - Insufficient role permissions:

```json
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```

**404 Not Found** - Lesson not found:

```json
{
  "statusCode": 404,
  "message": "Lesson with ID 999 not found"
}
```

---

## Business Rules

1. **Order Index**: Each lesson within a course should have a unique order index
2. **Course Relationship**: A lesson must belong to an existing course
3. **Cascade Delete**: When a course is deleted, all its lessons are automatically deleted
4. **Soft Delete**: Lessons can be soft-deleted (isActive = false) and restored later
5. **Hard Delete**: Permanently removes lessons from the database (irreversible)
6. **Active Status Filter**:
   - By default, only active lessons are returned in user-facing endpoints
   - Admin can access inactive lessons using `includeInactive=true` parameter
   - The `/lessons/course/:courseId/all` endpoint shows all lessons for admins
7. **Pagination**: Default pagination returns 10 items per page
8. **Sorting**: Lessons are sorted by order index in ascending order
9. **Restoration**: Only soft-deleted lessons can be restored; hard-deleted lessons cannot be recovered

---

## Usage Examples

### Create a new lesson

```bash
curl -X POST http://localhost:3000/lessons \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Lesson 1: Basic Greetings",
    "description": "Learn how to say hello and goodbye",
    "orderIndex": 1,
    "courseId": 1
  }'
```

### Get lessons for a specific course (active only)

```bash
curl -X GET "http://localhost:3000/lessons/course/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get all lessons for a course including inactive (Admin only)

```bash
curl -X GET "http://localhost:3000/lessons/course/1/all" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update a lesson

```bash
curl -X PUT http://localhost:3000/lessons/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Updated Lesson Name",
    "isActive": false
  }'
```

### Soft delete a lesson

```bash
curl -X DELETE http://localhost:3000/lessons/1/soft \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Hard delete a lesson (permanent)

```bash
curl -X DELETE http://localhost:3000/lessons/1/hard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Restore a soft-deleted lesson

```bash
curl -X PATCH http://localhost:3000/lessons/1/restore \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get paginated lessons with filters including inactive

```bash
curl -X GET "http://localhost:3000/lessons?page=1&limit=5&courseId=1&includeInactive=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get only inactive lessons

```bash
curl -X GET "http://localhost:3000/lessons?isActive=false&includeInactive=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
