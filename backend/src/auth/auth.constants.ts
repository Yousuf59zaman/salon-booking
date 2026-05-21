// Name of the cookie that will store the admin session JWT token
export const ADMIN_SESSION_COOKIE = 'admin_session';

// The cookie's maximum lifetime in milliseconds (7 days) for browser storage expiration
export const AUTH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// The JWT token's expiration duration in seconds (7 days) signed inside the token payload
export const AUTH_TOKEN_EXPIRES_SECONDS = 7 * 24 * 60 * 60;

// The default placeholder JWT secret (used for detecting insecure configurations)
export const DEFAULT_JWT_SECRET = 'replace-with-a-long-random-secret';

// The default URL of the frontend application used if FRONTEND_URL is not set in env
export const DEFAULT_FRONTEND_URL = 'http://localhost:3000';

