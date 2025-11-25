# Better Auth Integration Guide

A comprehensive guide for integrating Better Auth into Next.js applications with App Router.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Environment Variables](#environment-variables)
5. [Server Configuration](#server-configuration)
6. [Database Setup](#database-setup)
7. [Next.js Integration](#nextjs-integration)
8. [Client Setup](#client-setup)
9. [Authentication Methods](#authentication-methods)
10. [Session Management](#session-management)
11. [Social Providers](#social-providers)
12. [Troubleshooting](#troubleshooting)
13. [References](#references)

---

## Overview

Better Auth is a framework-agnostic, self-hosted authentication and authorization framework for TypeScript. It provides:

- Email/password authentication
- Social OAuth providers (Google, GitHub, etc.)
- Session management with cookie-based tokens
- Two-factor authentication
- Database adapters for multiple ORMs

**Key Advantage**: No external account needed - everything runs on your own infrastructure.

---

## Prerequisites

1. **Next.js Project** - Next.js 13+ with App Router
2. **Database** - One of the following:
   - PostgreSQL
   - MySQL
   - SQLite
   - MongoDB
3. **Node.js** - Version 18 or higher

---

## Installation

```bash
# npm
npm install better-auth

# pnpm
pnpm add better-auth

# yarn
yarn add better-auth

# bun
bun add better-auth
```

---

## Environment Variables

Create or update `.env.local` with the following variables:

```env
# Required
BETTER_AUTH_SECRET=your-random-secret-key-min-32-chars
BETTER_AUTH_URL=http://localhost:3000

# Database (choose one based on your setup)
DATABASE_URL=postgresql://user:password@localhost:5432/mydb

# Social Providers (optional)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Generating BETTER_AUTH_SECRET

```bash
# Using OpenSSL
openssl rand -base64 32

# Or use any random string generator (minimum 32 characters)
```

---

## Server Configuration

Create the auth configuration file at `lib/auth.ts` (or `src/lib/auth.ts`):

### Basic Configuration

```typescript
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  database: {
    provider: "pg", // or "mysql", "sqlite"
    url: process.env.DATABASE_URL!,
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
});
```

### With Drizzle Adapter

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db"; // Your Drizzle instance

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg", // or "mysql", "sqlite"
  }),
  emailAndPassword: {
    enabled: true,
  },
});
```

### With Prisma Adapter

```typescript
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma"; // Your Prisma instance

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql", // or "mysql", "sqlite"
  }),
  emailAndPassword: {
    enabled: true,
  },
});
```

---

## Database Setup

### Generate Schema

Better Auth provides a CLI to generate and apply database tables:

```bash
# Generate migration files (for Drizzle/Prisma)
npx @better-auth/cli generate

# Or apply directly via Kysely (quick setup)
npx @better-auth/cli migrate
```

### Required Tables

Better Auth creates the following tables:
- `user` - User accounts
- `session` - Active sessions
- `account` - OAuth provider accounts
- `verification` - Email verification tokens

---

## Next.js Integration

### Route Handler

Create the API route at `app/api/auth/[...all]/route.ts`:

```typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth.handler);
```

### Middleware (Optional)

For route protection, create `middleware.ts` in your project root:

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/next-js";

export function middleware(request: NextRequest) {
  // Optimistic check - only verifies cookie existence
  const session = getSessionCookie(request);

  if (!session && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
```

> **Note**: Always validate sessions server-side on protected pages. Middleware checks are optimistic only.

---

## Client Setup

Create the auth client at `lib/auth-client.ts`:

```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL, // Optional, defaults to current origin
});

// Export convenience methods
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;
```

### Using in Components

```tsx
"use client";

import { useSession, signOut } from "@/lib/auth-client";

export function UserMenu() {
  const { data: session, isPending } = useSession();

  if (isPending) return <div>Loading...</div>;

  if (!session) {
    return <a href="/login">Sign In</a>;
  }

  return (
    <div>
      <span>Welcome, {session.user.name}</span>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  );
}
```

### Server Component Usage

```tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return <div>Welcome, {session.user.name}</div>;
}
```

---

## Authentication Methods

### Email/Password Sign Up

```typescript
// Client-side
const result = await authClient.signUp.email({
  name: "John Doe",
  email: "john@example.com",
  password: "securePassword123",
  callbackURL: "/dashboard", // Optional redirect after signup
});

if (result.error) {
  console.error(result.error.message);
}
```

### Email/Password Sign In

```typescript
// Client-side
const result = await authClient.signIn.email({
  email: "john@example.com",
  password: "securePassword123",
  rememberMe: true, // Keep session on browser close
  callbackURL: "/dashboard",
});

if (result.error) {
  console.error(result.error.message);
}
```

### Sign Out

```typescript
await authClient.signOut();
// Or with redirect
await authClient.signOut({ callbackURL: "/" });
```

---

## Session Management

### Configuration Options

```typescript
export const auth = betterAuth({
  // ... other config
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days (default)
    updateAge: 60 * 60 * 24,     // Refresh session daily
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5-minute cache to reduce DB queries
    },
  },
});
```

### Session Operations

```typescript
// List all active sessions
const sessions = await authClient.listSessions();

// Revoke a specific session
await authClient.revokeSession({ token: "session-token" });

// Revoke all other sessions (keep current)
await authClient.revokeOtherSessions();

// Revoke all sessions (including current)
await authClient.revokeSessions();
```

---

## Social Providers

### GitHub Setup

1. **Create OAuth App**: Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. **Create New OAuth App**:
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
3. **Copy credentials** to `.env.local`

```typescript
// lib/auth.ts
export const auth = betterAuth({
  // ... other config
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
});
```

### Google Setup

1. **Create Project**: Go to [Google Cloud Console](https://console.cloud.google.com)
2. **Enable OAuth**: APIs & Services → Credentials → Create OAuth Client ID
3. **Configure Redirect URIs**:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`
4. **Copy credentials** to `.env.local`

```typescript
// lib/auth.ts
export const auth = betterAuth({
  // ... other config
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
});
```

### Sign In with Social Provider

```typescript
// Client-side
await authClient.signIn.social({
  provider: "github", // or "google"
  callbackURL: "/dashboard",
});
```

### Account Linking

Allow users to connect multiple providers to one account:

```typescript
export const auth = betterAuth({
  // ... other config
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github"],
    },
  },
});
```

---

## Troubleshooting

### Common Errors

#### "BETTER_AUTH_SECRET is not set"

Ensure your `.env.local` file contains:
```env
BETTER_AUTH_SECRET=your-secret-min-32-characters
```

#### "Database connection failed"

1. Verify `DATABASE_URL` is correct
2. Ensure database server is running
3. Check network connectivity

#### "Session not found in Server Component"

Make sure to pass headers to the session check:
```typescript
const session = await auth.api.getSession({
  headers: await headers(), // Don't forget await
});
```

#### "OAuth callback error"

1. Verify redirect URI matches exactly in provider settings
2. Check client ID and secret are correct
3. Ensure `BETTER_AUTH_URL` is set correctly

### Debug Mode

Enable verbose logging:

```typescript
export const auth = betterAuth({
  // ... other config
  advanced: {
    debug: true, // Only in development
  },
});
```

---

## References

- [Better Auth Documentation](https://www.better-auth.com/docs)
- [Better Auth GitHub](https://github.com/better-auth/better-auth)
- [Next.js Integration Guide](https://www.better-auth.com/docs/integrations/next)
- [Database Adapters](https://www.better-auth.com/docs/adapters)
- [Social Providers](https://www.better-auth.com/docs/authentication/oauth)
