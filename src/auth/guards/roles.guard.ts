import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../common/interfaces/user-role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    console.log('Required roles:', requiredRoles);
    
    if (!requiredRoles) {
      return true;
    }
    
    const { user } = context.switchToHttp().getRequest();
    console.log('User in roles guard:', user);
    
    if (!user || !user.role) {
      throw new UnauthorizedException('User role is not defined');
    }
    
    const hasRole = requiredRoles.some((role) => user.role === role);
    console.log('Has required role:', hasRole);
    
    return hasRole;
  }
} 