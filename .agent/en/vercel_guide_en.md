# Vercel Deployment Guide

A comprehensive guide for deploying Next.js applications to Vercel.

---

## Table of Contents

1. [Overview](#overview)
2. [Account Setup](#account-setup)
3. [CLI Installation](#cli-installation)
4. [Project Deployment](#project-deployment)
5. [Environment Variables](#environment-variables)
6. [Domain Configuration](#domain-configuration)
7. [GitHub Integration](#github-integration)
8. [Preview Deployments](#preview-deployments)
9. [CLI Commands Reference](#cli-commands-reference)
10. [Troubleshooting](#troubleshooting)
11. [References](#references)

---

## Overview

Vercel is a cloud platform optimized for frontend frameworks and static sites, with native support for Next.js. It provides:

- **Automatic deployments** from Git
- **Preview deployments** for every branch
- **Edge Network** for global CDN
- **Serverless Functions** for backend logic
- **Built-in analytics** and monitoring

---

## Account Setup

### 1. Create Vercel Account

1. Go to [https://vercel.com](https://vercel.com)
2. Click "Sign Up"
3. Sign up with:
   - GitHub (recommended for auto-deployment)
   - GitLab
   - Bitbucket
   - Email

### 2. Create Access Token (for CLI/CI)

1. Go to [Account Settings](https://vercel.com/account/tokens)
2. Click "Create Token"
3. Enter a descriptive name (e.g., "CLI Access" or "GitHub Actions")
4. Select scope (Full Account or specific team)
5. Set expiration (or no expiration)
6. Copy and save the token securely

---

## CLI Installation

### Install Globally

```bash
# npm
npm install -g vercel

# pnpm
pnpm add -g vercel

# yarn
yarn global add vercel

# bun
bun add -g vercel
```

### Verify Installation

```bash
vercel --version
```

### Login

```bash
# Interactive login (opens browser)
vercel login

# Login with email
vercel login your@email.com

# Login with token (for CI/CD)
vercel login --token YOUR_TOKEN
```

### Verify Login

```bash
vercel whoami
```

---

## Project Deployment

### First Deployment

Navigate to your project directory and run:

```bash
cd your-next-app
vercel
```

The CLI will prompt you to:
1. Set up and deploy? **Yes**
2. Which scope? Select your account/team
3. Link to existing project? **No** (for new projects)
4. Project name? Enter name or accept default
5. Directory with code? **./** (usually)
6. Override settings? **No** (usually)

### Deploy to Production

```bash
# Deploy to production
vercel --prod

# Or using the full command
vercel deploy --prod
```

### Deploy to Preview

```bash
# Preview deployment (default)
vercel

# Or explicitly
vercel deploy
```

### Deploy without Prompts

```bash
# Non-interactive deployment
vercel --yes --prod
```

---

## Environment Variables

### Environment Types

| Type | Description |
|------|-------------|
| **Production** | Applied to production deployments (main branch) |
| **Preview** | Applied to preview deployments (other branches) |
| **Development** | Used locally via `vercel dev` |

### Add via CLI

```bash
# Add to all environments
vercel env add MY_VAR

# Add to specific environment
vercel env add MY_VAR production
vercel env add MY_VAR preview
vercel env add MY_VAR development

# Add sensitive variable
vercel env add SECRET_KEY --sensitive
```

### Pull Environment Variables

Download environment variables to local `.env` file:

```bash
# Pull development variables
vercel env pull

# Pull to specific file
vercel env pull .env.local

# Pull from specific environment
vercel env pull --environment production
```

### List Environment Variables

```bash
vercel env ls
```

### Remove Environment Variable

```bash
vercel env rm MY_VAR
vercel env rm MY_VAR production
```

### Via Dashboard

1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add variables with name, value, and target environments

### Common Variables for Next.js

```env
# Example .env.local
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=https://yourdomain.com
```

> **Note**: Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

---

## Domain Configuration

### Add Custom Domain

```bash
# Add domain to project
vercel domains add yourdomain.com

# Add subdomain
vercel domains add app.yourdomain.com
```

### List Domains

```bash
vercel domains ls
```

### Remove Domain

```bash
vercel domains rm yourdomain.com
```

### Via Dashboard

1. Go to project **Settings** → **Domains**
2. Enter your domain name
3. Configure DNS records as instructed:

For apex domain (example.com):
```
Type: A
Name: @
Value: 76.76.21.21
```

For subdomain (app.example.com):
```
Type: CNAME
Name: app
Value: cname.vercel-dns.com
```

### Verify Domain

```bash
vercel domains verify yourdomain.com
```

---

## GitHub Integration

### Connect Repository (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import from GitHub repository
4. Select repository
5. Configure:
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: ./ (or monorepo path)
   - Build Command: `next build` (default)
   - Output Directory: `.next` (default)
6. Add environment variables
7. Click "Deploy"

### Auto-Deployment

Once connected, Vercel automatically:
- Deploys to **production** on push to main/master
- Creates **preview deployment** for every PR
- Adds deployment comments to PRs

### Disable Auto-Deployment

In project settings:
1. Go to **Settings** → **Git**
2. Toggle "Vercel for GitHub" settings

---

## Preview Deployments

### How It Works

Every push to a non-production branch creates a preview deployment with a unique URL:
- `https://project-git-branch-team.vercel.app`
- `https://project-xxxx.vercel.app`

### Preview Comments

Vercel automatically comments on PRs with:
- Preview deployment URL
- Build status
- Performance metrics

### Branch-Specific Environment Variables

Set variables only for specific branches:
1. Go to **Settings** → **Environment Variables**
2. Add variable
3. Under "Preview", specify branch names

---

## CLI Commands Reference

### Deployment

| Command | Description |
|---------|-------------|
| `vercel` | Deploy to preview |
| `vercel --prod` | Deploy to production |
| `vercel --yes` | Deploy without prompts |
| `vercel deploy --prebuilt` | Deploy pre-built output |

### Project Management

| Command | Description |
|---------|-------------|
| `vercel link` | Link local directory to project |
| `vercel unlink` | Unlink from project |
| `vercel project ls` | List projects |
| `vercel project rm <name>` | Remove project |

### Environment

| Command | Description |
|---------|-------------|
| `vercel env add <name>` | Add environment variable |
| `vercel env rm <name>` | Remove environment variable |
| `vercel env pull` | Download env vars to .env |
| `vercel env ls` | List environment variables |

### Domains

| Command | Description |
|---------|-------------|
| `vercel domains add <domain>` | Add domain |
| `vercel domains rm <domain>` | Remove domain |
| `vercel domains ls` | List domains |
| `vercel domains verify <domain>` | Verify domain |

### Logs & Debugging

| Command | Description |
|---------|-------------|
| `vercel logs <url>` | View deployment logs |
| `vercel logs --follow` | Stream logs in real-time |
| `vercel inspect <url>` | Inspect deployment details |

### Development

| Command | Description |
|---------|-------------|
| `vercel dev` | Run local development server |
| `vercel build` | Build project locally |

### Other

| Command | Description |
|---------|-------------|
| `vercel whoami` | Show current user |
| `vercel logout` | Log out |
| `vercel switch` | Switch teams |
| `vercel rollback <url>` | Rollback to deployment |
| `vercel redeploy` | Redeploy latest |

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Vercel CLI
        run: npm install -g vercel

      - name: Pull Vercel Environment Information
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build Project
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy to Vercel
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

### Get Project and Org IDs

```bash
# Link project first
vercel link

# IDs are stored in .vercel/project.json
cat .vercel/project.json
```

---

## Troubleshooting

### Common Errors

#### "Error: ENOENT: no such file or directory"

Build is looking for files not in the repository:
- Check `.gitignore` isn't excluding necessary files
- Verify build command is correct

#### "Error: Function Execution Timeout"

Serverless function exceeded time limit:
- Optimize function code
- Use streaming for long operations
- Increase timeout in `vercel.json`:

```json
{
  "functions": {
    "api/*.ts": {
      "maxDuration": 30
    }
  }
}
```

#### "Error: Environment variable not found"

- Ensure variable is added to correct environment
- Redeploy after adding variables
- Check variable name matches exactly (case-sensitive)

#### "Build failed"

```bash
# Check build logs
vercel logs <deployment-url>

# Build locally to debug
vercel build
```

### Debug Mode

```bash
# Enable debug output
vercel --debug

# Verbose logs
vercel deploy --debug
```

---

## References

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Domains Configuration](https://vercel.com/docs/projects/domains)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Vercel GitHub Integration](https://vercel.com/docs/deployments/git/vercel-for-github)
