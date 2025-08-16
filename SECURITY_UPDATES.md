# User Profile Update Security Changes

## Summary

Updated the user profile update DTOs to improve security and data integrity by restricting what fields users can modify.

## Changes Made

### 1. UpdateUserDto (Regular Users)

**Removed the following fields that users should NOT be able to update directly:**

- `totalStudyDays` - Should be managed by learning system
- `currentStreak` - Should be managed by learning system
- `longestStreak` - Should be managed by learning system
- `lastStudyDate` - Should be managed by learning system
- `isActive` - Should only be managed by admins
- `role` - Was never in this DTO, but confirmed it stays out

**Users can now only update:**

- `email` - Basic profile info
- `displayName` - Basic profile info
- `currentHskLevel` - User's preferred study level
- `nativeLanguage` - User's language preference

### 2. AdminUpdateUserDto (Admin Users)

**Removed study-related fields that should be managed by learning system:**

- `totalStudyDays` - Should be managed by learning system
- `currentStreak` - Should be managed by learning system
- `longestStreak` - Should be managed by learning system
- `lastStudyDate` - Should be managed by learning system

**Admins can still update:**

- `email` - Basic profile info
- `displayName` - Basic profile info
- `currentHskLevel` - User's study level
- `nativeLanguage` - User's language preference
- `role` - Admin privilege to change user roles
- `isActive` - Admin privilege to activate/deactivate accounts

## Security Benefits

1. **Role Protection**: Users cannot escalate their privileges by changing their role
2. **Study Integrity**: Study statistics cannot be manipulated directly, ensuring data accuracy
3. **System Consistency**: Learning progress will be managed through dedicated learning endpoints
4. **Audit Trail**: Critical changes (role, status) can only be made by admins

## Future Integration

When the learning system is implemented, it should:

- Update `totalStudyDays`, `currentStreak`, `longestStreak`, and `lastStudyDate`
- Provide separate endpoints for study progress tracking
- Maintain proper audit logs for learning activities

## API Impact

- User profile updates are now more secure and focused on basic profile data
- Admin updates retain necessary administrative controls
- API documentation has been updated to reflect these changes
