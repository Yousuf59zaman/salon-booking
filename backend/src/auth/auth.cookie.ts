import type { CookieOptions } from 'express';
import { AUTH_COOKIE_MAX_AGE_MS } from './auth.constants';

// Helper function to generate standard cookie configuration settings for the session cookie
export const getAdminSessionCookieOptions = (): CookieOptions => ({
  httpOnly: true, // Prevents client-side scripts (JS) from accessing the cookie to mitigate XSS attacks
  maxAge: AUTH_COOKIE_MAX_AGE_MS, // Duration for which the browser should store the cookie
  path: '/', // The path prefix for which this cookie is valid (accessible across the entire site)
  sameSite: 'lax', // Protects against CSRF (Cross-Site Request Forgery) by preventing cookie transmission on cross-site requests
  secure: process.env.NODE_ENV === 'production', // Requires HTTPS in production environment (transmits cookie only over secure connections)
});

// Helper function to generate configuration options specifically for clearing/deleting the cookie
export const getClearAdminSessionCookieOptions = (): CookieOptions => {
  // Destructure maxAge out so we don't send an expiration age, but keep the rest of the matching path/domain attributes
  const { maxAge: _maxAge, ...options } = getAdminSessionCookieOptions();

  return options;
};

