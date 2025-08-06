import { Injectable, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signUp(registerDto: RegisterDto): Promise<User> {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(registerDto.password, salt);

    return this.usersService.create(registerDto, passwordHash);
  }

  async validateUser(email: string, pass: string): Promise<string | null> {
    // Return JWT string or null
    const user = await this.usersService.findByEmail(email);

    if (user && (await bcrypt.compare(pass, user.passwordHash))) {
      // Create JWT payload
      const payload = {
        sub: user.id, // 'sub' is standard for user ID
        email: user.email,
        // Add any other claims you want in the token
      };

      // Generate and return JWT token
      return this.jwtService.sign(payload);
    }

    return null;
  }
}
