# Supabase Integration Guide

A comprehensive guide for integrating Supabase into Next.js applications with App Router.

---

## Table of Contents

1. [Overview](#overview)
2. [Account Setup](#account-setup)
3. [Installation](#installation)
4. [Environment Variables](#environment-variables)
5. [Client Configuration](#client-configuration)
6. [Database Operations](#database-operations)
7. [Authentication](#authentication)
8. [Storage](#storage)
9. [Real-time Subscriptions](#real-time-subscriptions)
10. [Row Level Security](#row-level-security)
11. [Troubleshooting](#troubleshooting)
12. [References](#references)

---

## Overview

Supabase is an open-source Firebase alternative that provides:

- **PostgreSQL Database** - Full Postgres with real-time capabilities
- **Authentication** - Email, OAuth, Magic Links, Phone auth
- **Storage** - File storage with CDN
- **Edge Functions** - Serverless functions
- **Real-time** - Live data subscriptions

---

## Account Setup

### 1. Create Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" or "Sign Up"
3. Sign in with GitHub or email

### 2. Create New Project

1. Click "New Project" in the dashboard
2. Select your organization
3. Enter project details:
   - **Name**: Your project name
   - **Database Password**: Save this securely (needed for direct DB connections)
   - **Region**: Choose closest to your users
4. Click "Create new project"
5. Wait for project provisioning (1-2 minutes)

### 3. Get API Credentials

1. Go to **Project Settings** → **API**
2. Copy the following values:
   - **Project URL**: `https://[project-ref].supabase.co`
   - **anon/public key**: For client-side operations
   - **service_role key**: For server-side operations (keep secret!)

---

## Installation

```bash
# npm
npm install @supabase/supabase-js @supabase/ssr

# pnpm
pnpm add @supabase/supabase-js @supabase/ssr

# yarn
yarn add @supabase/supabase-js @supabase/ssr

# bun
bun add @supabase/supabase-js @supabase/ssr
```

---

## Environment Variables

Create or update `.env.local`:

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Server-side only (for admin operations)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> **Security Note**: Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client. It bypasses Row Level Security.

---

## Client Configuration

### Browser Client

Create `utils/supabase/client.ts`:

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### Server Client

Create `utils/supabase/server.ts`:

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from Server Component - ignore
          }
        },
      },
    }
  );
}
```

### Admin Client (Server-only)

Create `utils/supabase/admin.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
```

---

## Database Operations

### Select (Read)

```typescript
import { createClient } from "@/utils/supabase/server";

// Basic select
const supabase = await createClient();
const { data, error } = await supabase
  .from("posts")
  .select();

// Select specific columns
const { data, error } = await supabase
  .from("posts")
  .select("id, title, created_at");

// With filtering
const { data, error } = await supabase
  .from("posts")
  .select()
  .eq("status", "published")
  .order("created_at", { ascending: false })
  .limit(10);

// With joins (foreign tables)
const { data, error } = await supabase
  .from("posts")
  .select(`
    id,
    title,
    author:users(name, email)
  `);
```

### Insert (Create)

```typescript
// Single insert
const { data, error } = await supabase
  .from("posts")
  .insert({
    title: "My Post",
    content: "Hello World",
    user_id: userId,
  })
  .select()
  .single();

// Bulk insert
const { data, error } = await supabase
  .from("posts")
  .insert([
    { title: "Post 1", content: "Content 1" },
    { title: "Post 2", content: "Content 2" },
  ])
  .select();
```

### Update

```typescript
const { data, error } = await supabase
  .from("posts")
  .update({ title: "Updated Title" })
  .eq("id", postId)
  .select()
  .single();
```

### Delete

```typescript
const { error } = await supabase
  .from("posts")
  .delete()
  .eq("id", postId);
```

### Upsert

```typescript
const { data, error } = await supabase
  .from("posts")
  .upsert({
    id: postId, // If exists, update; otherwise insert
    title: "New or Updated Title",
  })
  .select()
  .single();
```

---

## Authentication

### Middleware Setup

Create `middleware.ts` in your project root:

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired
  const { data: { user } } = await supabase.auth.getUser();

  // Protect routes
  if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

### Sign Up

```typescript
"use client";

import { createClient } from "@/utils/supabase/client";

async function signUp(email: string, password: string) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) throw error;
  return data;
}
```

### Sign In

```typescript
"use client";

import { createClient } from "@/utils/supabase/client";

async function signIn(email: string, password: string) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}
```

### OAuth Sign In

```typescript
"use client";

import { createClient } from "@/utils/supabase/client";

async function signInWithGitHub() {
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) throw error;
}
```

### Auth Callback Route

Create `app/auth/callback/route.ts`:

```typescript
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`);
}
```

### Sign Out

```typescript
"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return <button onClick={handleSignOut}>Sign Out</button>;
}
```

### Get Current User (Server)

```typescript
import { createClient } from "@/utils/supabase/server";

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <div>Welcome, {user.email}</div>;
}
```

---

## Storage

### Create Bucket (Dashboard)

1. Go to **Storage** in Supabase Dashboard
2. Click "New bucket"
3. Enter bucket name and configure:
   - **Public**: Check for publicly accessible files
   - **File size limit**: Set max upload size

### Upload File

```typescript
const supabase = createClient();

async function uploadFile(file: File, bucket: string, path: string) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw error;
  return data;
}

// Usage
const file = event.target.files[0];
await uploadFile(file, "avatars", `${userId}/avatar.png`);
```

### Download File

```typescript
const { data, error } = await supabase.storage
  .from("avatars")
  .download("user123/avatar.png");

// Create URL for display
const url = URL.createObjectURL(data);
```

### Get Public URL

```typescript
const { data } = supabase.storage
  .from("avatars")
  .getPublicUrl("user123/avatar.png");

console.log(data.publicUrl);
```

### Delete File

```typescript
const { error } = await supabase.storage
  .from("avatars")
  .remove(["user123/avatar.png"]);
```

---

## Real-time Subscriptions

### Subscribe to Table Changes

```typescript
"use client";

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";

function RealtimePosts() {
  const [posts, setPosts] = useState([]);
  const supabase = createClient();

  useEffect(() => {
    // Initial fetch
    supabase.from("posts").select().then(({ data }) => {
      setPosts(data || []);
    });

    // Subscribe to changes
    const channel = supabase
      .channel("posts-changes")
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT, UPDATE, DELETE
          schema: "public",
          table: "posts",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setPosts((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setPosts((prev) =>
              prev.map((p) => (p.id === payload.new.id ? payload.new : p))
            );
          } else if (payload.eventType === "DELETE") {
            setPosts((prev) =>
              prev.filter((p) => p.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

---

## Row Level Security

### Enable RLS on Table

```sql
-- In Supabase SQL Editor
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
```

### Common Policies

```sql
-- Allow public read access
CREATE POLICY "Public read access"
ON posts FOR SELECT
TO public
USING (true);

-- Users can only read their own data
CREATE POLICY "Users can read own posts"
ON posts FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own data
CREATE POLICY "Users can create posts"
ON posts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own data
CREATE POLICY "Users can update own posts"
ON posts FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own data
CREATE POLICY "Users can delete own posts"
ON posts FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
```

---

## Troubleshooting

### Common Errors

#### "Invalid API key"

- Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
- Check for extra whitespace in environment variables

#### "Row Level Security policy violation"

- Ensure RLS policies are set up correctly
- Use service role key for admin operations (server-side only)

#### "JWT expired"

- Middleware should handle token refresh automatically
- Check middleware is correctly configured

#### "relation does not exist"

- Table hasn't been created yet
- Check table name spelling (case-sensitive)

### Debug Tips

```typescript
// Enable debug logging
const supabase = createClient(url, key, {
  global: {
    headers: { "x-debug": "true" },
  },
});

// Check current user
const { data: { user }, error } = await supabase.auth.getUser();
console.log("Current user:", user);
console.log("Auth error:", error);
```

---

## References

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Next.js Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Auth Quickstart](https://supabase.com/docs/guides/auth/quickstarts/nextjs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Guide](https://supabase.com/docs/guides/storage)
- [Realtime Guide](https://supabase.com/docs/guides/realtime)
