import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from './interfaces/jwt-payload.interface';


@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  async login(user: any) {
    try {
      const userData = await this.usersService.findByEmail(user.email);
      if (!userData) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Verify password
      if (!(await bcrypt.compare(user.password, userData.password))) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const payload: JwtPayload = {
        email: userData.email,
        sub: userData._id.toString(),
        role: userData.role,
      };

      console.log('Login payload:', payload); // Debug log
      const token = this.jwtService.sign(payload);
      
      return {
        access_token: token,
        user: {
          id: userData._id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
        },
      };
    } catch (error) {
      console.error('Login error:', error); // Debug log
      throw new UnauthorizedException('Login failed');
    }
  }

  async getCurrentUser(userId: string) {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const { password, ...result } = user.toObject();
    return result;
  }
} 