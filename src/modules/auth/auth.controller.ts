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
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Create a new user account with email, password, and display name. Email must be unique.',
  })
  @ApiCreatedResponse({
    description: 'User successfully registered',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        email: { type: 'string', example: 'user@example.com' },
        displayName: { type: 'string', example: 'John Doe' },
        role: { type: 'string', example: 'user' },
        isActive: { type: 'boolean', example: true },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Bad request - validation failed',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'array',
          items: { type: 'string' },
          example: [
            'email must be a valid email',
            'Password must be at least 8 characters long',
          ],
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiConflictResponse({
    description: 'Email already exists',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: 'Email already exists' },
        error: { type: 'string', example: 'Conflict' },
      },
    },
  })
  @ApiBody({ type: RegisterDto })
  @UseInterceptors(ClassSerializerInterceptor) // This will use the @Exclude() in User entity
  @Post('signup')
  signUp(@Body() registerDto: RegisterDto) {
    return this.authService.signUp(registerDto);
  }

  @ApiOperation({
    summary: 'Login user',
    description:
      'Authenticate user with email and password, returns JWT access token',
  })
  @ApiOkResponse({
    description: 'Successfully logged in',
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          description: 'JWT access token for authentication',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Invalid credentials' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiBody({
    description: 'User login credentials',
    schema: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'user@example.com',
          description: 'User email address',
        },
        password: {
          type: 'string',
          format: 'password',
          example: 'SecurePassword123!',
          description: 'User password',
        },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @UseGuards(LocalGuard)
  login(@Req() req: Request) {
    return {
      access_token: req.user, // req.user now contains the JWT token string
    };
  }

  @ApiOperation({
    summary: 'Check authentication status',
    description:
      'Verify if the current JWT token is valid and return user authentication status',
  })
  @ApiOkResponse({
    description: 'User is authenticated',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'You are authenticated',
          description: 'Authentication status message',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiBearerAuth('JWT-auth')
  @Get('status')
  @UseGuards(JWTGuard, RolesGuard)
  @Roles(Role.Admin, Role.User)
  getStatus(@Req() req: Request) {
    console.log('User status check:', req.user);
    return { message: 'You are authenticated' };
  }
}
