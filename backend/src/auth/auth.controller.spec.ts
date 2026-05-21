// Mock PrismaService as it's not the target of this controller unit test
jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { AuthController } from './auth.controller';
import { ADMIN_SESSION_COOKIE, AUTH_COOKIE_MAX_AGE_MS } from './auth.constants';
import { AuthService } from './auth.service';
import { RequestWithAdmin } from './auth.types';

describe('AuthController', () => {
  let authService: {
    login: jest.Mock;
  };
  let controller: AuthController;
  // Save the original process.env.NODE_ENV state to restore it after all tests complete
  const originalNodeEnv = process.env.NODE_ENV;

  // Set up mock service and controller instance before each test
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    authService = {
      login: jest.fn(),
    };
    controller = new AuthController(authService as unknown as AuthService);
  });

  // Tear down environment variables back to their original state
  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('sets the admin session cookie after login', async () => {
    // Mock the Express response object with a cookie setter spy/mock
    const response = {
      cookie: jest.fn(),
    };
    // Mock AuthService login method to return correct credentials and token
    authService.login.mockResolvedValue({
      admin: {
        id: 'admin_1',
        email: 'admin@glamcut.local',
      },
      token: 'signed-token',
    });

    // Invoke login and assert the returned admin details
    await expect(
      controller.login(
        {
          email: 'admin@glamcut.local',
          password: 'correct-password',
        },
        response as never,
      ),
    ).resolves.toEqual({
      admin: {
        id: 'admin_1',
        email: 'admin@glamcut.local',
      },
    });

    // Assert that the session cookie was set with the correct secure options
    expect(response.cookie).toHaveBeenCalledWith(
      ADMIN_SESSION_COOKIE,
      'signed-token',
      {
        httpOnly: true,
        maxAge: AUTH_COOKIE_MAX_AGE_MS,
        path: '/',
        sameSite: 'lax',
        secure: false, // false because process.env.NODE_ENV is set to 'test' (not 'production')
      },
    );
  });

  it('clears the admin session cookie on logout', () => {
    // Mock the Express response object with a clearCookie spy/mock
    const response = {
      clearCookie: jest.fn(),
    };

    // Invoke logout and assert return value
    expect(controller.logout(response as never)).toEqual({ success: true });
    // Assert that the clearCookie method was called to clear the admin session cookie
    expect(response.clearCookie).toHaveBeenCalledWith(ADMIN_SESSION_COOKIE, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: false,
    });
  });

  it('returns the authenticated admin from the request', () => {
    // Create a mock Express Request with authenticated admin pre-attached by the guard
    const request = {
      admin: {
        id: 'admin_1',
        email: 'admin@glamcut.local',
      },
    } as RequestWithAdmin;

    // Invoke controller.me and assert that it correctly returns the attached admin
    expect(controller.me(request)).toEqual({
      admin: {
        id: 'admin_1',
        email: 'admin@glamcut.local',
      },
    });
  });
});

