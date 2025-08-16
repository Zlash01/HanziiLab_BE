# Users CRUD API Documentation

This API provides comprehensive user management functionality with role-based access control.

## Authentication

All endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## User Roles

- **User**: Can view and edit their own profile
- **Admin**: Can perform all CRUD operations on any user

## Endpoints

### User Profile Management

#### Get Current User Profile

- **GET** `/users/profile`
- **Roles**: User, Admin
- **Description**: Get the authenticated user's profile information
- **Response**: User object without password

#### Update Current User Profile

- **PUT** `/users/profile`
- **Roles**: User, Admin
- **Description**: Update the authenticated user's profile
- **Body**:

```json
{
  "email": "string (optional)",
  "displayName": "string (optional)",
  "currentHskLevel": "number (1-6, optional)",
  "nativeLanguage": "string (optional)"
}
```

- **Note**: Users can only update basic profile information. Study progress, streaks, and role changes are managed through other systems.

### Admin Operations

#### Get All Users (Paginated)

- **GET** `/users`
- **Roles**: Admin only
- **Description**: Get all users with pagination and filtering
- **Query Parameters**:
  - `page`: number (default: 1)
  - `limit`: number (default: 10)
  - `role`: "user" | "admin" (optional)
  - `isActive`: boolean (optional)
- **Response**:

```json
{
  "users": [User[]],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

#### Get User by ID

- **GET** `/users/:id`
- **Roles**: Admin only
- **Description**: Get a specific user by their ID
- **Response**: User object without password

#### Update Any User

- **PUT** `/users/:id`
- **Roles**: Admin only
- **Description**: Update any user's information (including role and account status)
- **Body**:

```json
{
  "email": "string (optional)",
  "displayName": "string (optional)",
  "role": "user" | "admin" (optional)",
  "currentHskLevel": "number (1-6, optional)",
  "nativeLanguage": "string (optional)",
  "isActive": "boolean (optional)"
}
```

- **Note**: Study progress and streaks should be managed through the learning system, not direct API updates.

#### Soft Delete User

- **DELETE** `/users/:id`
- **Roles**: Admin only
- **Description**: Soft delete a user (sets isActive to false)
- **Response**: 204 No Content

#### Hard Delete User

- **DELETE** `/users/:id/hard`
- **Roles**: Admin only
- **Description**: Permanently delete a user from the database
- **Response**: 204 No Content
- **⚠️ Warning**: This action is irreversible

#### Restore User

- **PUT** `/users/:id/restore`
- **Roles**: Admin only
- **Description**: Restore a soft-deleted user (sets isActive to true)
- **Response**: Updated user object

#### Get User Statistics

- **GET** `/users/stats`
- **Roles**: Admin only
- **Description**: Get user statistics and metrics
- **Response**:

```json
{
  "totalUsers": 100,
  "activeUsers": 95,
  "inactiveUsers": 5,
  "adminUsers": 2,
  "regularUsers": 98
}
```

## Error Responses

All endpoints return appropriate HTTP status codes:

- **200**: Success
- **201**: Created
- **204**: No Content
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (invalid/missing token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **409**: Conflict (e.g., email already exists)

Example error response:

```json
{
  "statusCode": 400,
  "message": ["email must be a valid email"],
  "error": "Bad Request"
}
```

## Usage Examples

### Login and Get Token

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'
```

### Update Own Profile (User)

```bash
curl -X PUT http://localhost:3000/users/profile \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"displayName": "New Name", "currentHskLevel": 3}'
```

### Get All Users (Admin)

```bash
curl -X GET "http://localhost:3000/users?page=1&limit=5&role=user" \
  -H "Authorization: Bearer <admin-token>"
```

### Update User Role and Status (Admin)

```bash
curl -X PUT http://localhost:3000/users/123 \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"role": "admin", "isActive": true}'
```
