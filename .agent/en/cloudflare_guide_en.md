# Cloudflare Deployment Guide

A comprehensive guide for deploying applications to Cloudflare using Workers and Pages.

---

## Table of Contents

1. [Overview](#overview)
2. [Account Setup](#account-setup)
3. [CLI Installation (Wrangler)](#cli-installation-wrangler)
4. [Deploying Workers](#deploying-workers)
5. [Deploying Pages](#deploying-pages)
6. [Environment Variables](#environment-variables)
7. [Storage (KV, R2, D1)](#storage-kv-r2-d1)
8. [Custom Domains](#custom-domains)
9. [GitHub Integration](#github-integration)
10. [CLI Commands Reference](#cli-commands-reference)
11. [Troubleshooting](#troubleshooting)
12. [References](#references)

---

## Overview

Cloudflare provides a global edge network for running applications with low latency. Key services include:

- **Cloudflare Workers**: Serverless functions running on the edge.
- **Cloudflare Pages**: Jamstack platform for frontend developers.
- **R2**: S3-compatible object storage.
- **KV**: Key-Value storage.
- **D1**: Serverless SQL database.

---

## Account Setup

### 1. Create Cloudflare Account

1. Go to [https://dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)
2. Enter email and password
3. Verify email address

### 2. API Token (Optional for CLI)

For local development, `wrangler login` is sufficient. For CI/CD:

1. Go to [My Profile > API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use template "Edit Cloudflare Workers"
4. Copy the token

---

## CLI Installation (Wrangler)

Wrangler is the command-line tool for Cloudflare Workers and Pages.

### Install Locally (Recommended)

```bash
npm install -D wrangler
```

### Install Globally

```bash
npm install -g wrangler
```

### Login

```bash
wrangler login
```
This will open a browser to authenticate.

### Verify Login

```bash
wrangler whoami
```

---

## Deploying Workers

### Initialize Project

```bash
npm create cloudflare@latest my-worker
```
Follow the prompts to select a template (e.g., "Hello World" Worker).

### Local Development

```bash
cd my-worker
npm start
# or
npx wrangler dev
```
Starts a local server at `http://localhost:8787`.

### Deploy

```bash
npm run deploy
# or
npx wrangler deploy
```

---

## Deploying Pages

### Initialize Project

```bash
npm create cloudflare@latest my-page -- --type=pages
```
Or use your existing framework (React, Vue, Next.js, etc.).

### Deploy Static Site

```bash
# Build your site first
npm run build

# Deploy the output directory (e.g., dist, out, build)
npx wrangler pages deploy dist
```

### Deploy Full Stack (Functions)

Place serverless functions in a `functions/` directory.

```bash
npx wrangler pages deploy .
```

---

## Environment Variables

### In `wrangler.toml` (Workers)

```toml
# wrangler.toml
name = "my-worker"

[vars]
API_HOST = "example.com"
DEBUG = "true"
```

### Secrets (Sensitive Data)

Do not commit secrets to `wrangler.toml`. Use `wrangler secret`.

```bash
# Add secret
npx wrangler secret put API_KEY

# List secrets
npx wrangler secret list
```

### For Pages

Configure in Dashboard: **Settings** > **Environment variables**.

---

## Storage (KV, R2, D1)

### KV (Key-Value)

1. **Create Namespace**:
   ```bash
   npx wrangler kv:namespace create "MY_KV"
   ```
2. **Add to `wrangler.toml`**:
   ```toml
   [[kv_namespaces]]
   binding = "MY_KV"
   id = "your_namespace_id"
   ```
3. **Usage in Code**:
   ```javascript
   await env.MY_KV.put("key", "value");
   const val = await env.MY_KV.get("key");
   ```

### R2 (Object Storage)

1. **Create Bucket**:
   ```bash
   npx wrangler r2 bucket create my-bucket
   ```
2. **Add to `wrangler.toml`**:
   ```toml
   [[r2_buckets]]
   binding = "MY_BUCKET"
   bucket_name = "my-bucket"
   ```

### D1 (SQL Database)

1. **Create Database**:
   ```bash
   npx wrangler d1 create my-db
   ```
2. **Add to `wrangler.toml`**:
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "my-db"
   database_id = "your_db_id"
   ```

---

## Custom Domains

### Workers

In `wrangler.toml`:

```toml
routes = [
	{ pattern = "api.example.com/*", zone_name = "example.com" }
]
```

Or via Dashboard: **Worker** > **Triggers** > **Custom Domains**.

### Pages

1. Go to Pages project > **Custom domains**
2. Click **Set up a custom domain**
3. Enter domain (e.g., `app.example.com`)
4. Cloudflare automatically configures DNS if managed by Cloudflare.

---

## GitHub Integration

### Cloudflare Pages (Git Integration)

1. Go to Dashboard > **Workers & Pages** > **Create Application** > **Pages** > **Connect to Git**
2. Select Repository
3. Configure Build settings (Framework preset, Build command, Output directory)
4. Click **Save and Deploy**

Automatic deployments on push to `main` (Production) and other branches (Preview).

### Workers (GitHub Actions)

Use the official action:

```yaml
name: Deploy Worker
on: [push]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

---

## CLI Commands Reference

| Command | Description |
|---------|-------------|
| `wrangler dev` | Start local dev server |
| `wrangler deploy` | Deploy Worker to global network |
| `wrangler tail` | View live logs from deployed Worker |
| `wrangler secret put <name>` | Set a secret variable |
| `wrangler kv:key put <key> <val>` | Write to KV |
| `wrangler pages deploy <dir>` | Deploy static assets to Pages |
| `wrangler login` | Authenticate CLI |

---

## Troubleshooting

### "Error: No account_id found"

- Run `wrangler login` again.
- Or specify `account_id` in `wrangler.toml`.

### "Error: Script too large"

- Free plan limit is 1MB (compressed).
- Paid plan limit is 10MB.
- Check for large dependencies.

### "Error: 10027 Workers API returned error"

- Usually syntax error or runtime error in your code.
- Run `wrangler dev` to debug locally.
- Use `wrangler tail` to see production logs.

---

## References

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [Storage (KV, R2, D1)](https://developers.cloudflare.com/workers/platform/storage-options/)
