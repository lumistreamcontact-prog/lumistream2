import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { ROLES } from "./constants";

export const SESSION_COOKIE = "ls_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days (remember me)
const SESSION_MAX_AGE_SHORT = 60 * 60 * 12; // 12h (no remember me)

export interface SessionUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string;
  avatar: string | null;
}

interface SessionPayload {
  sub: string;
  role: string;
}

function secret(): string {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 16) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET must be set to a strong value in production.");
    }
    return "lumistream-development-only-secret-key";
  }
  return value;
}

/* ------------------------------------------------------------------ */
/* Passwords                                                          */
/* ------------------------------------------------------------------ */

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/* ------------------------------------------------------------------ */
/* Session tokens                                                     */
/* ------------------------------------------------------------------ */

export function signSessionToken(payload: SessionPayload): string {
  return jwt.sign(payload, secret(), { expiresIn: SESSION_MAX_AGE });
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, secret()) as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSessionCookie(
  userId: string,
  role: string,
  remember = true,
): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, signSessionToken({ sub: userId, role }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: remember ? SESSION_MAX_AGE : SESSION_MAX_AGE_SHORT,
  });
}

export async function destroySessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/* ------------------------------------------------------------------ */
/* Session lookups (server-side)                                      */
/* ------------------------------------------------------------------ */

/**
 * Reads the session cookie and resolves the user. Cached per request so that
 * many components can call it without extra DB round-trips.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = verifySessionToken(token);
  if (!payload?.sub) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      avatar: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) return null;
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatar: user.avatar,
  };
});

/** Use inside server components/route handlers that require a signed-in user. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/** Use inside server components/route handlers that require an admin. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== ROLES.ADMIN) redirect("/");
  return user;
}

export function isAdmin(user: SessionUser | null): boolean {
  return user?.role === ROLES.ADMIN;
}

/** Non-redirecting variants, for API routes. */
export async function getSessionUserOrNull(): Promise<SessionUser | null> {
  return getSessionUser();
}