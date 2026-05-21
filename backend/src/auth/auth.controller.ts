import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { AdminAuthGuard } from './admin-auth.guard';
import {
  getAdminSessionCookieOptions,
  getClearAdminSessionCookieOptions,
} from './auth.cookie';
import { ADMIN_SESSION_COOKIE } from './auth.constants';
import { AuthService } from './auth.service';
import type { RequestWithAdmin } from './auth.types';
import { LoginDto } from './dto/login.dto';

@ApiTags('Auth') // Swagger decorator to group these endpoints under the "Auth" section
@Controller('auth') // Sets base route prefix for all endpoints in this controller (e.g. "/auth")
export class AuthController {
  // Inject the AuthService instance via NestJS Dependency Injection
  constructor(private readonly authService: AuthService) {}

  @Post('login') // Defines POST route at "/auth/login"
  @HttpCode(200) // Sets the HTTP status code to 200 OK (default for POST is 201 Created)
  @ApiOkResponse({ description: 'Admin login succeeded.' }) // Swagger doc for successful login
  @ApiUnauthorizedResponse({ description: 'Invalid email or password.' }) // Swagger doc for failed login
  async login(
    @Body() loginDto: LoginDto, // Validates and binds incoming request body to the LoginDto structure
    @Res({ passthrough: true }) response: Response, // Injects Express Response. passthrough: true lets us edit headers while NestJS still handles return value formatting
  ) {
    // Authenticate the user and generate a JWT token
    const { admin, token } = await this.authService.login(loginDto);

    // Set the cookie on the response with the generated JWT token
    response.cookie(
      ADMIN_SESSION_COOKIE,
      token,
      getAdminSessionCookieOptions(),
    );

    // Return the authenticated admin details to the client
    return { admin };
  }

  @Post('logout') // Defines POST route at "/auth/logout"
  @HttpCode(200) // Sets HTTP response code to 200 OK
  @ApiOkResponse({ description: 'Admin session cleared.' }) // Swagger doc for logout
  logout(@Res({ passthrough: true }) response: Response) {
    // Clear the admin session cookie by sending an expired cookie header
    response.clearCookie(
      ADMIN_SESSION_COOKIE,
      getClearAdminSessionCookieOptions(),
    );

    return { success: true };
  }

  @Get('me') // Defines GET route at "/auth/me"
  @UseGuards(AdminAuthGuard) // Protects this endpoint; requests must pass through AdminAuthGuard to reach this handler
  @ApiCookieAuth(ADMIN_SESSION_COOKIE) // Swagger doc indicating that this endpoint requires the admin_session cookie
  @ApiOkResponse({ description: 'Current admin session.' }) // Swagger doc for successful fetch
  @ApiUnauthorizedResponse({ description: 'Admin session missing or invalid.' }) // Swagger doc for unauthorized fetch
  me(@Req() request: RequestWithAdmin) {
    // Return the authenticated admin object that was appended to the request by the AdminAuthGuard
    return { admin: request.admin };
  }
}

