import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

// Mock the PrismaService dependency because it is imported by AuthService, but not directly tested in the guard unit tests
jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { AdminAuthGuard } from './admin-auth.guard';
import { ADMIN_SESSION_COOKIE } from './auth.constants';
import { AuthService } from './auth.service';

// Helper function to build a mock NestJS ExecutionContext with a custom request object
const contextForRequest = (request: unknown): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  }) as ExecutionContext;

describe('AdminAuthGuard', () => {
  let authService: {
    verifySession: jest.Mock;
  };
  let guard: AdminAuthGuard;

  // Initialize mocks and instantiate the guard before each test case
  beforeEach(() => {
    authService = {
      verifySession: jest.fn(),
    };
    guard = new AdminAuthGuard(authService as unknown as AuthService);
  });

  it('attaches the admin to the request for a valid cookie token', async () => {
    // Mock incoming request containing the session cookie
    const request = {
      cookies: {
        [ADMIN_SESSION_COOKIE]: 'signed-token',
      },
    };
    // Mock the session verification to succeed and return the admin object
    authService.verifySession.mockResolvedValue({
      id: 'admin_1',
      email: 'admin@glamcut.local',
    });

    // Run the guard and assert that it allows activation (returns true)
    await expect(guard.canActivate(contextForRequest(request))).resolves.toBe(
      true,
    );
    // Assert that the admin details were correctly attached/mutated onto the request object
    expect(request).toEqual({
      cookies: {
        [ADMIN_SESSION_COOKIE]: 'signed-token',
      },
      admin: {
        id: 'admin_1',
        email: 'admin@glamcut.local',
      },
    });
  });

  it('rejects a missing admin session cookie', async () => {
    // Mock the session verification to throw an UnauthorizedException when cookie is missing
    authService.verifySession.mockRejectedValue(
      new UnauthorizedException('Admin session is required.'),
    );

    // Assert that the guard throws an UnauthorizedException when cookie is missing
    await expect(
      guard.canActivate(contextForRequest({ cookies: {} })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    // Verify verifySession was called with undefined (cookie not provided)
    expect(authService.verifySession).toHaveBeenCalledWith(undefined);
  });

  it('rejects an invalid admin session cookie', async () => {
    // Mock the session verification to throw an UnauthorizedException for invalid tokens
    authService.verifySession.mockRejectedValue(
      new UnauthorizedException('Invalid or expired admin session.'),
    );

    // Assert that the guard throws an UnauthorizedException for the bad token
    await expect(
      guard.canActivate(
        contextForRequest({
          cookies: {
            [ADMIN_SESSION_COOKIE]: 'bad-token',
          },
        }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    // Verify verifySession was called with the bad token
    expect(authService.verifySession).toHaveBeenCalledWith('bad-token');
  });
});

