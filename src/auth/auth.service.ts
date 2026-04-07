import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  /**
   * Validates user credentials.
   * Uses findByEmail (single DB query) to prevent timing attacks from loading all users.
   * Always runs bcrypt.compare even when user not found to prevent user-enumeration timing attacks.
   */
  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);

    // Always compare to prevent timing-based user enumeration
    const dummyHash = '$2b$10$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    const isMatch = await bcrypt.compare(pass, user ? user.password : dummyHash);

    if (user && isMatch) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      token: this.jwtService.sign(payload),
      user: {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const existing = await this.usersService.findByEmail(registerDto.email);
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 12);
    const newUser = await this.usersService.create({
      name: registerDto.name,
      email: registerDto.email,
      password: hashedPassword,
      role: 'user', // Always force 'user' — never trust client-supplied role
    });

    return this.login(newUser);
  }

  async tempResetPassword(email: string, pass: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return { error: 'User not found' };
    
    const hashedPassword = await bcrypt.hash(pass, 12);
    
    // We need to update the password directly in the DB
    // since usersService.update might exclude the password field.
    // Accessing the repository from the service if it's public or adding it.
    await (this.usersService as any).userRepository.update(user.id, { password: hashedPassword });

    return { message: `Password for ${email} has been updated to '${pass}' with valid hash.` };
  }

  async createDefaultAdmin() {
    const email = 'nada@allsheneeds.com';
    const password = 'nada2025';
    const existing = await this.usersService.findByEmail(email);
    
    if (existing) {
      if (existing.role === 'admin') {
        return { message: 'Admin already exists', user: { email: existing.email, role: existing.role } };
      }
      // Upgrade existing user to admin
      await (this.usersService as any).userRepository.update(existing.id, { role: 'admin' });
      return { message: 'Existing user promoted to admin', email };
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await this.usersService.create({
      name: 'Admin',
      email,
      password: hashedPassword,
      role: 'admin',
    });

    return { 
      message: 'Initial admin created successfully!', 
      credentials: { email, password },
      note: 'Please change your password immediately after logging in.'
    };
  }
}
