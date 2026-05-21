import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ADMIN_SESSION_COOKIE } from './auth.constants';
import { AuthService } from './auth.service';
import { RequestWithOptionalAdmin } from './auth.types';

// The @Injectable decorator allows NestJS to inject AuthService into the constructor
@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  // canActivate determines whether the request should proceed or be blocked (returns true/false or throws error)
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Switch the NestJS execution context to HTTP to access the underlying Express request object
    const request = context
      .switchToHttp()
      .getRequest<RequestWithOptionalAdmin>();
    
    // Extract the JWT session token from the incoming cookies
    const token = request.cookies?.[ADMIN_SESSION_COOKIE];

    // Verify the session using AuthService; if invalid, verifySession throws an UnauthorizedException
    // If valid, the verified admin user object is appended to the request object for use in controllers
    request.admin = await this.authService.verifySession(token);

    // Return true to allow the request to proceed to the controller handler
    return true;
  }
}

