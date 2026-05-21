import {
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';

// Mock PrismaService in this test since we'll mock Prisma database calls manually
jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { JwtService } from '@nestjs/jwt';
import { hash } from 'bcryptjs';
import { AUTH_TOKEN_EXPIRES_SECONDS } from './auth.constants';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let findUnique: jest.Mock;
  let jwtService: {
    signAsync: jest.Mock;
    verifyAsync: jest.Mock;
  };
  let service: AuthService;
  // Save the original environment secret to restore it after all tests complete
  const originalJwtSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    // Inject mock environment variable secret for JWT
    process.env.JWT_SECRET = 'unit-test-secret';
    findUnique = jest.fn();
    jwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    };
    // Instantiate AuthService with mocked PrismaService and mocked JwtService
    service = new AuthService(
      { adminUser: { findUnique } } as unknown as PrismaService,
      jwtService as unknown as JwtService,
    );
  });

  // Restore JWT secret after tests run to avoid side effects on other tests
  afterAll(() => {
    process.env.JWT_SECRET = originalJwtSecret;
  });

  it('logs in a valid admin with a signed token', async () => {
    // Generate a real bcrypt hash of the correct password for comparison
    const passwordHash = await hash('correct-password', 4);
    // Mock Prisma findUnique to return our admin database record
    findUnique.mockResolvedValue({
      id: 'admin_1',
      email: 'admin@glamcut.local',
      passwordHash,
    });
    // Mock the JWT signing process to return our fake signed token
    jwtService.signAsync.mockResolvedValue('signed-token');

    // Run login (with padded email to test email trimming and normalization)
    await expect(
      service.login({
        email: ' Admin@GlamCut.Local ',
        password: 'correct-password',
      }),
    ).resolves.toEqual({
      admin: {
        id: 'admin_1',
        email: 'admin@glamcut.local',
      },
      token: 'signed-token',
    });

    // Verify Prisma query filter is lowercase and trimmed
    expect(findUnique).toHaveBeenCalledWith({
      where: { email: 'admin@glamcut.local' },
      select: {
        id: true,
        email: true,
        passwordHash: true,
      },
    });
    // Verify JWT was signed with the correct payload structure and secret
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      { sub: 'admin_1', email: 'admin@glamcut.local' },
      {
        expiresIn: AUTH_TOKEN_EXPIRES_SECONDS,
        secret: 'unit-test-secret',
      },
    );
  });

  it('rejects an unknown admin email', async () => {
    // Mock Prisma to return null (user not found)
    findUnique.mockResolvedValue(null);

    // Assert that login throws UnauthorizedException
    await expect(
      service.login({
        email: 'missing@glamcut.local',
        password: 'any-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    // Ensure JWT token generation was not invoked since auth failed
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('rejects an invalid admin password', async () => {
    // Hash correct password, but pass incorrect password to login call
    const passwordHash = await hash('correct-password', 4);
    findUnique.mockResolvedValue({
      id: 'admin_1',
      email: 'admin@glamcut.local',
      passwordHash,
    });

    // Assert that login throws UnauthorizedException when incorrect password is provided
    await expect(
      service.login({
        email: 'admin@glamcut.local',
        password: 'wrong-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('fails login clearly when JWT_SECRET is not configured', async () => {
    // Configure environment variable to match placeholder, triggering the configuration error
    process.env.JWT_SECRET = 'replace-with-a-long-random-secret';
    const passwordHash = await hash('correct-password', 4);
    findUnique.mockResolvedValue({
      id: 'admin_1',
      email: 'admin@glamcut.local',
      passwordHash,
    });

    // Assert that login throws an InternalServerErrorException indicating bad config
    await expect(
      service.login({
        email: 'admin@glamcut.local',
        password: 'correct-password',
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('returns the current admin for a valid session token', async () => {
    // Mock token verification to return valid payload claims
    jwtService.verifyAsync.mockResolvedValue({
      sub: 'admin_1',
      email: 'admin@glamcut.local',
    });
    // Mock database check verifying user still exists
    findUnique.mockResolvedValue({
      id: 'admin_1',
      email: 'admin@glamcut.local',
    });

    // Assert that session verification succeeds and returns admin details
    await expect(service.verifySession('signed-token')).resolves.toEqual({
      id: 'admin_1',
      email: 'admin@glamcut.local',
    });
  });

  it('rejects a missing session token', async () => {
    // Assert that verifySession throws UnauthorizedException when token is undefined
    await expect(service.verifySession(undefined)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('rejects an invalid session token', async () => {
    // Mock verifyAsync to fail (indicating expired or forged signature)
    jwtService.verifyAsync.mockRejectedValue(new Error('bad token'));

    // Assert verifySession throws UnauthorizedException
    await expect(service.verifySession('bad-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('fails session verification clearly when JWT_SECRET is not configured', async () => {
    // Configure environment variable to match placeholder
    process.env.JWT_SECRET = 'replace-with-a-long-random-secret';

    // Assert verifySession throws InternalServerErrorException
    await expect(service.verifySession('signed-token')).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });
});

