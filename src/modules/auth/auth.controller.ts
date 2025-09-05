import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  ClassSerializerInterceptor,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { UseGuards } from '@nestjs/common';
import { LocalGuard } from './guard/local.guard';
import { JWTGuard } from './guard/jwt.guard';
import { RolesGuard } from './guard/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { Role } from './enums/role.enum';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @ApiBody({ type: RegisterDto })
  @UseInterceptors(ClassSerializerInterceptor) // This will use the @Exclude() in User entity
  @Post('signup')
  signUp(@Body() registerDto: RegisterDto) {
    return this.authService.signUp(registerDto);
  }

  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Successfully logged in', schema: { properties: { access_token: { type: 'string' } } } })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiBody({ schema: { properties: { email: { type: 'string' }, password: { type: 'string' } } } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @UseGuards(LocalGuard)
  login(@Req() req: Request) {
    return {
      access_token: req.user, // req.user now contains the JWT token string
    };
  }

  @ApiOperation({ summary: 'Check authentication status' })
  @ApiResponse({ status: 200, description: 'User is authenticated', schema: { properties: { message: { type: 'string' } } } })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth()
  @Get('status')
  @UseGuards(JWTGuard, RolesGuard)
  @Roles(Role.Admin, Role.User)
  getStatus(@Req() req: Request) {
    console.log('User status check:', req.user);
    return { message: 'You are authenticated' };
  }
}
