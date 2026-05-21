import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import {
  AUTH_TOKEN_EXPIRES_SECONDS,
  DEFAULT_JWT_SECRET,
} from './auth.constants';
import { AuthenticatedAdmin, JwtAdminPayload } from './auth.types';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from '../prisma/prisma.service';

interface LoginResult {
  admin: AuthenticatedAdmin;
  token: string;
}

@Injectable()
export class AuthService {
  // Inject the database client wrapper (PrismaService) and NestJS JWT utilities
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // Handles admin credentials validation and session generation
  async login(loginDto: LoginDto): Promise<LoginResult> {
    // Normalize email input by trimming whitespace and converting to lowercase
    const email = loginDto.email.trim().toLowerCase();
    
    // Find the admin user in the database by email
    const admin = await this.prisma.adminUser.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
      },
    });

    // If the admin user doesn't exist, throw a generic 401 Unauthorized exception
    if (!admin) {
      throw this.invalidCredentials();
    }

    // Verify password by comparing plain text input with hashed password from the database
    const passwordMatches = await compare(
      loginDto.password,
      admin.passwordHash,
    );

    // If password hash comparison fails, throw a generic 401 Unauthorized exception
    if (!passwordMatches) {
      throw this.invalidCredentials();
    }

    // Generate/Sign the JWT session token with admin details as payload
    const token = await this.jwtService.signAsync(
      { sub: admin.id, email: admin.email } satisfies JwtAdminPayload,
      {
        expiresIn: AUTH_TOKEN_EXPIRES_SECONDS, // Expiration time (e.g. 7 days)
        secret: this.getJwtSecret(), // The server secret used to sign the token securely
      },
    );

    return {
      admin: {
        id: admin.id,
        email: admin.email,
      },
      token,
    };
  }

  // Verifies the incoming cookie-based JWT session token
  async verifySession(token: string | undefined): Promise<AuthenticatedAdmin> {
    // If token is missing, throw a 401 Unauthorized exception
    if (!token) {
      throw new UnauthorizedException('Admin session is required.');
    }

    let payload: JwtAdminPayload;
    const secret = this.getJwtSecret();

    try {
      // Decode and verify the JWT signature using the configured secret key
      payload = await this.jwtService.verifyAsync<JwtAdminPayload>(token, {
        secret,
      });
    } catch {
      // Throw 401 if the token signature is invalid or the token has expired
      throw new UnauthorizedException('Invalid or expired admin session.');
    }

    // Confirm that required payload claims are present
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid or expired admin session.');
    }

    // Verify that the user specified in the token still exists in our database
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
      },
    });

    // If the admin user was deleted since the token was issued, reject the session
    if (!admin) {
      throw new UnauthorizedException('Invalid or expired admin session.');
    }

    return admin;
  }

  // Helper method to retrieve the JWT secret from environment variables with safety checks
  private getJwtSecret(): string {
    const secret = process.env.JWT_SECRET?.trim();

    // Prevent application from running if JWT_SECRET is missing or left as the insecure default placeholder
    if (!secret || secret === DEFAULT_JWT_SECRET) {
      throw new InternalServerErrorException(
        'Admin auth is not configured. Set a real JWT_SECRET.',
      );
    }

    return secret;
  }

  // Helper method to generate standard unauthorized response to obfuscate account existence
  private invalidCredentials(): UnauthorizedException {
    return new UnauthorizedException('Invalid email or password.');
  }
}

