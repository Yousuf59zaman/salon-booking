import type { Request } from 'express';

// Represents the structure of the authenticated admin object stored in memory and attached to request context
export interface AuthenticatedAdmin {
  id: string; // The database ID of the admin user
  email: string; // The email address of the admin user
}

// Defines the shape of the decoded JSON Web Token (JWT) payload
export interface JwtAdminPayload {
  sub: string; // Subject field: represents the unique identifier of the admin (admin ID)
  email: string; // The admin's email address
}

// Extends the standard Express Request interface to guarantee that the `admin` property is present and defined (used on protected routes)
export interface RequestWithAdmin extends Request {
  admin: AuthenticatedAdmin;
}

// Extends the standard Express Request interface where the `admin` property might be optional/undefined (used in guards prior to authentication)
export interface RequestWithOptionalAdmin extends Request {
  admin?: AuthenticatedAdmin;
}

