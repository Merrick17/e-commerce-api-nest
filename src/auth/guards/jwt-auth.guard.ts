import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    try {
      const request = context.switchToHttp().getRequest();
      console.log('Auth Header:', request.headers.authorization); // Debug log
      
      const result = (await super.canActivate(context)) as boolean;
      
      if (!request.user) {
        console.log('No user object after JWT validation'); // Debug log
        throw new UnauthorizedException('User not authenticated');
      }
      
      console.log('Validated user:', request.user); // Debug log
      return result;
    } catch (err) {
      console.error('JWT validation error:', err); // Debug log
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
} 