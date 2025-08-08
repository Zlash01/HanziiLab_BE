import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { RegisterDto } from '../auth/dto/register.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { Role } from '../auth/enums/role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(registerDto: RegisterDto, passwordHash: string): Promise<User> {
    const newUser = this.usersRepository.create({
      ...registerDto,
      passwordHash,
    });
    return this.usersRepository.save(newUser);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  // Get all users with pagination and filtering (Admin only)
  async findAll(
    query: GetUsersQueryDto,
  ): Promise<{ users: User[]; total: number }> {
    const { page = 1, limit = 10, role, isActive } = query;
    const queryBuilder = this.usersRepository.createQueryBuilder('user');

    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive });
    }

    const [users, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('user.createdAt', 'DESC')
      .getManyAndCount();

    return { users, total };
  }

  // Update user profile (user can only update their own profile)
  async updateProfile(
    userId: number,
    updateUserDto: UpdateUserDto,
    requestingUserId: number,
    requestingUserRole: Role,
  ): Promise<User> {
    // Check if user exists
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check permissions: users can only update their own profile, admins can update any
    if (requestingUserRole !== Role.Admin && userId !== requestingUserId) {
      throw new ForbiddenException('You can only update your own profile');
    }

    // Check if email already exists (if updating email)
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser) {
        throw new BadRequestException('Email already exists');
      }
    }

    // Update the user
    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  // Admin update user (includes role updates)
  async adminUpdateUser(
    userId: number,
    adminUpdateUserDto: AdminUpdateUserDto,
  ): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if email already exists (if updating email)
    if (adminUpdateUserDto.email && adminUpdateUserDto.email !== user.email) {
      const existingUser = await this.findByEmail(adminUpdateUserDto.email);
      if (existingUser) {
        throw new BadRequestException('Email already exists');
      }
    }

    Object.assign(user, adminUpdateUserDto);
    return this.usersRepository.save(user);
  }

  // Soft delete user (Admin only)
  async deleteUser(userId: number): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Soft delete by setting isActive to false
    user.isActive = false;
    await this.usersRepository.save(user);
  }

  // Hard delete user (Admin only - use with caution)
  async hardDeleteUser(userId: number): Promise<void> {
    const result = await this.usersRepository.delete(userId);
    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
  }

  // Restore user (Admin only)
  async restoreUser(userId: number): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isActive = true;
    return this.usersRepository.save(user);
  }

  // Get user statistics (Admin only)
  async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    adminUsers: number;
    regularUsers: number;
  }> {
    const [totalUsers, activeUsers, inactiveUsers, adminUsers, regularUsers] =
      await Promise.all([
        this.usersRepository.count(),
        this.usersRepository.count({ where: { isActive: true } }),
        this.usersRepository.count({ where: { isActive: false } }),
        this.usersRepository.count({ where: { role: Role.Admin } }),
        this.usersRepository.count({ where: { role: Role.User } }),
      ]);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      adminUsers,
      regularUsers,
    };
  }
}
