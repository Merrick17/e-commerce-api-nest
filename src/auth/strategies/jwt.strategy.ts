import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    try {
      if (!payload || !payload.sub || !payload.email || !payload.role) {
        throw new UnauthorizedException('Invalid token payload');
      }
      
      return { 
        userId: payload.sub,
        email: payload.email,
        role: payload.role
      };
    } catch (error) {
      throw new UnauthorizedException('Token validation failed');
    }
  }
} 