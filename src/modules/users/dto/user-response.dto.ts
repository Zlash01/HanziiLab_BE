export class UserResponseDto {
  id: number;
  email: string;
  displayName: string;
  role: string;
  currentHskLevel: number;
  nativeLanguage: string;
  totalStudyDays: number;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
