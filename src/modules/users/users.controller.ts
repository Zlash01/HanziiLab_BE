import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { JWTGuard } from '../auth/guard/jwt.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Controller('users')
@UseGuards(JWTGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /users/profile - Get current user's profile
  @Get('profile')
  @Roles(Role.User, Role.Admin)
  async getProfile(@Req() req: Request) {
    const user = req.user as JwtPayload;
    return this.usersService.findById(user.id);
  }

  // PUT /users/profile - Update current user's profile
  @Put('profile')
  @Roles(Role.User, Role.Admin)
  async updateProfile(
    @Req() req: Request,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = req.user as JwtPayload;
    return this.usersService.updateProfile(
      user.id,
      updateUserDto,
      user.id,
      user.role,
    );
  }

  // GET /users/stats - Get user statistics (Admin only)
  @Get('stats')
  @Roles(Role.Admin)
  async getUserStats() {
    return this.usersService.getUserStats();
  }

  // GET /users - Get all users with pagination and filters (Admin only)
  @Get()
  @Roles(Role.Admin)
  async getAllUsers(@Query() query: GetUsersQueryDto) {
    const { users, total } = await this.usersService.findAll(query);
    const { page = 1, limit = 10 } = query;

    return {
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // GET /users/:id - Get user by ID (Admin only)
  @Get(':id')
  @Roles(Role.Admin)
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  // PUT /users/:id - Update any user (Admin only)
  @Put(':id')
  @Roles(Role.Admin)
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() adminUpdateUserDto: AdminUpdateUserDto,
  ) {
    return this.usersService.adminUpdateUser(id, adminUpdateUserDto);
  }

  // DELETE /users/:id - Soft delete user (Admin only)
  @Delete(':id')
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    await this.usersService.deleteUser(id);
  }

  // DELETE /users/:id/hard - Hard delete user (Admin only)
  @Delete(':id/hard')
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  async hardDeleteUser(@Param('id', ParseIntPipe) id: number) {
    await this.usersService.hardDeleteUser(id);
  }

  // PUT /users/:id/restore - Restore soft-deleted user (Admin only)
  @Put(':id/restore')
  @Roles(Role.Admin)
  async restoreUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.restoreUser(id);
  }
}
