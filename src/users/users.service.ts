import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: DeepPartial<User>): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    // Select without password to avoid exposing hashed passwords in bulk queries
    return this.userRepository.find({
      select: ['id', 'name', 'email', 'role'],
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'name', 'email', 'role'],
    });
    if (!user) {
      throw new NotFoundException(`User not found`);
    }
    return user;
  }

  /**
   * Used by AuthService — loads password for bcrypt comparison.
   * Not exposed via the public findOne to avoid accidental password leaks.
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      select: ['id', 'name', 'email', 'password', 'role'],
    });
  }

  async update(id: string, updateUserDto: any): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User not found`);
    }

    // Prevent role escalation via update — only allow safe fields
    const { role, password, ...safeFields } = updateUserDto;
    this.userRepository.merge(user, safeFields);
    const saved = await this.userRepository.save(user);
    const { password: _pw, ...result } = saved as any;
    return result;
  }

  async remove(id: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User not found`);
    }
    await this.userRepository.remove(user);
  }
}
