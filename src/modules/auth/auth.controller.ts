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

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseInterceptors(ClassSerializerInterceptor) // This will use the @Exclude() in User entity
  @Post('signup')
  signUp(@Body() registerDto: RegisterDto) {
    return this.authService.signUp(registerDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @UseGuards(LocalGuard)
  login(@Req() req: Request) {
    return {
      access_token: req.user, // req.user now contains the JWT token string
    };
  }

  @Get('status')
  @UseGuards(JWTGuard, RolesGuard)
  @Roles(Role.Admin, Role.User)
  getStatus(@Req() req: Request) {
    console.log('User status check:', req.user);
    return { message: 'You are authenticated' };
  }
}
