# Railway Deployment Guide

A comprehensive guide covering both Railway CLI and GraphQL API for project deployment.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [CLI Installation and Authentication](#cli-installation-and-authentication)
3. [Project Management](#project-management)
4. [Service Creation and GitHub Integration](#service-creation-and-github-integration)
5. [Environment Variables](#environment-variables)
6. [Domain Configuration](#domain-configuration)
7. [Deployment Management](#deployment-management)
8. [Local Development](#local-development)
9. [CI/CD Integration](#cicd-integration)
10. [GraphQL API Reference](#graphql-api-reference)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

1. **Railway CLI Installation**
   ```bash
   # macOS (Homebrew)
   brew install railway

   # Or use the official script
   bash <(curl -fsSL cli.new)
   ```

2. **Railway Workspace Token** (for API usage)
   - Create at [Railway Tokens Page](https://railway.com/account/tokens)

3. **GitHub Repository** - Code pushed to GitHub

---

## CLI Installation and Authentication

### Method 1: Browserless Mode (Recommended)

Suitable for CI/CD environments or when local callback server has issues.

```bash
railway login --browserless
```

**Flow:**
1. CLI displays a URL and pairing code
2. Visit the URL in your browser
3. Enter the pairing code to complete authentication

**Advantages:**
- No dependency on local callback server
- Avoids firewall/port issues
- Suitable for remote environments

### Method 2: Browser Mode

```bash
railway login
```

**Notes:**
- Older CLI versions (< 4.11.1) may have callback failure bugs
- Recommend upgrading to the latest version

### Verify Login

```bash
railway whoami
```

---

## Project Management

### CLI: Initialize New Project

```bash
cd your-project-directory
railway init
```

**Interactive flow:**
```
> Create a new project
> Enter project name: my-project
> Select a starter: Empty Project
```

### CLI: Link Existing Project

```bash
# Interactive selection
railway link

# Or specify project ID directly
railway link --project PROJECT_ID
```

### CLI: View Status

```bash
# Check current link status
railway status

# Link specific service
railway service
```

### API: Create Project

**GraphQL Mutation (Basic):**
```graphql
mutation {
  projectCreate(input: {}) {
    id
    name
  }
}
```

**GraphQL Mutation (With Configuration):**
```graphql
mutation {
  projectCreate(
    input: {
      name: "my-project-name"
      description: "Project description"
      defaultEnvironmentName: "production"
      isPublic: false
    }
  ) {
    id
    name
    description
  }
}
```

**cURL Example:**
```bash
curl -H "Authorization: Bearer YOUR_WORKSPACE_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"query": "mutation { projectCreate(input: { name: \"my-project\" }) { id name } }"}' \
     https://backboard.railway.app/graphql/v2
```

**Available Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | String | Project name (optional, randomly generated if not specified) |
| `description` | String | Project description |
| `defaultEnvironmentName` | String | Default environment name (default "production") |
| `isPublic` | Boolean | Whether the project is public |
| `isMonorepo` | Boolean | Whether it's a monorepo project |
| `prDeploys` | Boolean | Enable PR deployments |
| `repo` | Object | GitHub repository info |
| `workspaceId` | String | Workspace ID |

### API: Rename Project

```graphql
mutation {
  projectUpdate(id: "PROJECT_ID", input: { name: "new-project-name" }) {
    id
    name
  }
}
```

---

## Service Creation and GitHub Integration

### CLI: Deploy from Current Directory

```bash
# Ensure project is linked
railway link

# Deploy from current directory
railway up

# Or in detach mode
railway up --detach
```

### Dashboard: Connect GitHub (Recommended for Production)

Due to CLI limitations for GitHub integration, configuring auto-deployment via Dashboard is recommended:

1. **Open Project**
   ```bash
   railway open
   ```

2. **Configure in Dashboard**
   - Go to Service → Settings → Source
   - Connect GitHub repository
   - Select branch (e.g., `main`)
   - Configure build settings

3. **Auto Deploy**
   - Pushing to GitHub automatically triggers deployment
   - Recommended for production environments

### API: Create Service and Connect GitHub

```graphql
mutation {
  serviceCreate(
    input: {
      projectId: "PROJECT_ID"
      name: "service-name"
      source: { repo: "GitHubUsername/repo-name" }
    }
  ) {
    id
    name
  }
}
```

**cURL Example:**
```bash
curl -H "Authorization: Bearer YOUR_WORKSPACE_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"query": "mutation { serviceCreate(input: { projectId: \"PROJECT_ID\", name: \"my-service\", source: { repo: \"username/repo-name\" } }) { id name } }"}' \
     https://backboard.railway.app/graphql/v2
```

**Notes:**
- `repo` format is `username/repository-name`
- After creating a service, Railway automatically triggers the first deployment
- Record the returned service `id` for subsequent configuration

---

## Environment Variables

### CLI: Set Variables

```bash
# Interactive add
railway variables set

# Direct set
railway variables set KEY=value

# Import from .env file
railway variables set --env-file .env
```

### CLI: View Variables

```bash
# List all variables
railway variables

# Output as JSON
railway variables --json
```

### CLI: Delete Variables

```bash
railway variables delete KEY
```

### API: Batch Set Variables

First, get the Environment ID:

```graphql
query {
  project(id: "PROJECT_ID") {
    environments {
      edges {
        node {
          id
          name
        }
      }
    }
  }
}
```

Then set variables:

```graphql
mutation {
  variableCollectionUpsert(
    input: {
      projectId: "PROJECT_ID"
      environmentId: "ENVIRONMENT_ID"
      serviceId: "SERVICE_ID"
      variables: {
        KEY1: "value1"
        KEY2: "value2"
        NODE_ENV: "production"
      }
    }
  )
}
```

**cURL Example:**
```bash
curl -H "Authorization: Bearer YOUR_WORKSPACE_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"query": "mutation { variableCollectionUpsert(input: { projectId: \"PROJECT_ID\", environmentId: \"ENVIRONMENT_ID\", serviceId: \"SERVICE_ID\", variables: { NODE_ENV: \"production\", API_KEY: \"secret123\" } }) }"}' \
     https://backboard.railway.app/graphql/v2
```

---

## Domain Configuration

### CLI: Generate Railway Domain

```bash
# Generate domain for current service
railway domain

# Specify port
railway domain --port 3000

# Generate for specific service
railway domain --service my-service
```

### CLI: Add Custom Domain

```bash
railway domain yourdomain.com
```

CLI will return the DNS records that need to be configured.

### API: Generate Railway Domain

```graphql
mutation {
  serviceDomainCreate(
    input: {
      serviceId: "SERVICE_ID"
      environmentId: "ENVIRONMENT_ID"
    }
  ) {
    id
    domain
  }
}
```

**Response Example:**
```json
{
  "data": {
    "serviceDomainCreate": {
      "id": "domain-id",
      "domain": "my-service-production.up.railway.app"
    }
  }
}
```

### API: Add Custom Domain

```graphql
mutation {
  customDomainCreate(
    input: {
      serviceId: "SERVICE_ID"
      environmentId: "ENVIRONMENT_ID"
      domain: "example.com"
    }
  ) {
    id
    domain
    status {
      dnsRecords {
        type
        name
        value
      }
    }
  }
}
```

### API: Query Existing Domains

```graphql
query {
  service(id: "SERVICE_ID") {
    id
    name
    serviceInstances {
      edges {
        node {
          id
          domains {
            serviceDomains {
              domain
              id
            }
          }
        }
      }
    }
  }
}
```

### Domain Update Limitations

> **Important**: Updating the prefix of existing Railway-provided domains (e.g., from `my-service-production.up.railway.app` to `new-name-production.up.railway.app`) via GraphQL API is currently not supported.
>
> Attempting to use the `serviceDomainUpdate` mutation will return a `"Problem processing request"` error.
>
> **Solution**: Update domain prefix manually through Railway Dashboard:
> 1. Visit Project Settings → Networking
> 2. Click the settings icon next to the existing domain
> 3. Update the domain prefix
>
> **Alternative**: Delete existing domain and create new one (not recommended, may cause downtime)

---

## Deployment Management

### CLI: View Logs

```bash
# View logs in real-time
railway logs

# View last 100 lines
railway logs --limit 100

# Continuously output new logs
railway logs --follow
```

### CLI: Redeploy

```bash
railway redeploy
```

### CLI: Rollback (via Dashboard)

CLI doesn't support direct rollback, use Dashboard:
```bash
railway open
```

### API: Query Deployment Status

```graphql
query {
  service(id: "SERVICE_ID") {
    id
    name
    deployments(first: 1) {
      edges {
        node {
          id
          status
          url
          createdAt
        }
      }
    }
  }
}
```

**Deployment Status Values:**

- `BUILDING` - Building
- `DEPLOYING` - Deploying
- `SUCCESS` - Deployment successful
- `FAILED` - Deployment failed
- `CRASHED` - Runtime crashed

---

## Local Development

### Run Local Commands with Railway Environment Variables

```bash
# Run development server
railway run npm run dev

# Run any command
railway run python manage.py migrate
```

### Open Interactive Shell

```bash
railway shell
```

In this shell, all Railway environment variables are loaded.

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install Railway CLI
        run: npm i -g @railway/cli

      - name: Deploy to Railway
        run: railway up --detach
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

**Get RAILWAY_TOKEN:**
1. Visit https://railway.com/account/tokens
2. Create Project Token
3. Add to GitHub Secrets

### API: Create Project Token (for CI/CD)

Use Workspace Token to create Project Token for specific project and environment:

```graphql
mutation {
  projectTokenCreate(
    input: {
      projectId: "PROJECT_ID"
      environmentId: "ENVIRONMENT_ID"
      name: "token-name"
    }
  )
}
```

**Response Example:**
```json
{
  "data": {
    "projectTokenCreate": "8a6b5c5b-463a-4f71-836e-2870a236f8d0"
  }
}
```

**Using Project Token:**
```bash
# Set environment variable
export RAILWAY_TOKEN=8a6b5c5b-463a-4f71-836e-2870a236f8d0

# Deploy using Railway CLI
railway up --detach
```

**Delete Project Token:**
```graphql
mutation {
  projectTokenDelete(id: "TOKEN_ID")
}
```

**Notes:**
- Project Token is only valid for the specified project and environment
- Ideal for CI/CD pipelines like GitHub Actions
- Token cannot be viewed again after creation, save it securely
- Recommend creating different tokens for different CI/CD pipelines for easier management and revocation

---

## GraphQL API Reference

### API Endpoint

```
https://backboard.railway.app/graphql/v2
```

### Authentication

Use Bearer Token for authentication:

```bash
curl -H "Authorization: Bearer YOUR_WORKSPACE_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"query": "..."}' \
     https://backboard.railway.app/graphql/v2
```

### Complete Deployment Script Example

```bash
#!/bin/bash

# Configuration variables
RAILWAY_TOKEN="your-workspace-token"
GITHUB_REPO="username/repo-name"
API_URL="https://backboard.railway.app/graphql/v2"

# 1. Create project
PROJECT_RESPONSE=$(curl -s -H "Authorization: Bearer $RAILWAY_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"query": "mutation { projectCreate(input: {}) { id name } }"}' \
     $API_URL)

PROJECT_ID=$(echo $PROJECT_RESPONSE | jq -r '.data.projectCreate.id')
echo "Created project: $PROJECT_ID"

# 2. Rename project
curl -s -H "Authorization: Bearer $RAILWAY_TOKEN" \
     -H "Content-Type: application/json" \
     -d "{\"query\": \"mutation { projectUpdate(id: \\\"$PROJECT_ID\\\", input: { name: \\\"my-project\\\" }) { id name } }\"}" \
     $API_URL

# 3. Create service and connect GitHub
SERVICE_RESPONSE=$(curl -s -H "Authorization: Bearer $RAILWAY_TOKEN" \
     -H "Content-Type: application/json" \
     -d "{\"query\": \"mutation { serviceCreate(input: { projectId: \\\"$PROJECT_ID\\\", name: \\\"web\\\", source: { repo: \\\"$GITHUB_REPO\\\" } }) { id name } }\"}" \
     $API_URL)

SERVICE_ID=$(echo $SERVICE_RESPONSE | jq -r '.data.serviceCreate.id')
echo "Created service: $SERVICE_ID"

# 4. Get environment ID
ENV_RESPONSE=$(curl -s -H "Authorization: Bearer $RAILWAY_TOKEN" \
     -H "Content-Type: application/json" \
     -d "{\"query\": \"query { project(id: \\\"$PROJECT_ID\\\") { environments { edges { node { id name } } } } }\"}" \
     $API_URL)

ENVIRONMENT_ID=$(echo $ENV_RESPONSE | jq -r '.data.project.environments.edges[0].node.id')
echo "Environment ID: $ENVIRONMENT_ID"

# 5. Set environment variables
curl -s -H "Authorization: Bearer $RAILWAY_TOKEN" \
     -H "Content-Type: application/json" \
     -d "{\"query\": \"mutation { variableCollectionUpsert(input: { projectId: \\\"$PROJECT_ID\\\", environmentId: \\\"$ENVIRONMENT_ID\\\", serviceId: \\\"$SERVICE_ID\\\", variables: { NODE_ENV: \\\"production\\\" } }) }\"}" \
     $API_URL

# 6. Create public domain
DOMAIN_RESPONSE=$(curl -s -H "Authorization: Bearer $RAILWAY_TOKEN" \
     -H "Content-Type: application/json" \
     -d "{\"query\": \"mutation { serviceDomainCreate(input: { serviceId: \\\"$SERVICE_ID\\\", environmentId: \\\"$ENVIRONMENT_ID\\\" }) { id domain } }\"}" \
     $API_URL)

DOMAIN=$(echo $DOMAIN_RESPONSE | jq -r '.data.serviceDomainCreate.domain')
echo "Deployment URL: https://$DOMAIN"
```

---

## Troubleshooting

### Common Errors and Solutions

#### 1. `railway login` Fails

**Symptom**: Still shows "Unauthorized" after browser authorization

**Solution**:
```bash
# Clean configuration
rm -f ~/.railway/config.json
railway logout

# Use browserless mode
railway login --browserless
```

#### 2. "Project Token not found"

**Cause**: Project not properly linked

**Solution**:
```bash
# Re-link project
railway link

# Or delete local config and retry
rm -rf .railway
railway link
```

#### 3. Deployment Failed

**Check steps**:
```bash
# 1. View logs
railway logs

# 2. Check build command
# Configure in Dashboard Settings → Build

# 3. Check environment variables
railway variables

# 4. Manually trigger redeploy
railway redeploy
```

#### 4. Domain Inaccessible

**Checklist**:
- Confirm service port is correct (Railway auto-detects by default)
- Check if service deployed successfully
- Wait for DNS propagation (custom domains)

```bash
# View service status
railway status

# View latest logs
railway logs --limit 50
```

#### 5. API "Unauthorized" Error

- Check if Token is correct
- Confirm Token type (needs Workspace/Team Token, not Project Token for most operations)
- Verify Token hasn't expired

#### 6. API "Problem processing request" Error

- Check if GraphQL syntax is correct
- Confirm all required parameters are provided
- Verify IDs are valid

---

## Quick Reference

### CLI Commands

| Command | Description |
|---------|-------------|
| `railway login --browserless` | Login without browser |
| `railway whoami` | View current user |
| `railway init` | Initialize new project |
| `railway link` | Link existing project |
| `railway status` | View project status |
| `railway up` | Deploy current directory |
| `railway logs` | View logs |
| `railway domain` | Generate domain |
| `railway variables` | Manage environment variables |
| `railway run <cmd>` | Run command with Railway env vars |
| `railway shell` | Open interactive shell |
| `railway open` | Open project in browser |
| `railway redeploy` | Redeploy |
| `railway list` | List all projects |

### CLI vs Dashboard vs API

| Operation | CLI | Dashboard | GraphQL API |
|-----------|-----|-----------|-------------|
| Initial project setup | ✅ Recommended | ✅ Recommended | ❌ Complex |
| GitHub connection | ❌ Not supported | ✅ Recommended | ⚠️ Limited |
| Environment variables | ✅ Recommended | ✅ Good | ✅ Supported |
| Domain generation | ✅ Recommended | ✅ Recommended | ✅ Supported |
| Domain update | ❌ Not supported | ✅ Only way | ❌ Not supported |
| Trigger deployment | ✅ Recommended | ✅ Recommended | ✅ Supported |
| View logs | ✅ Recommended | ✅ Recommended | ⚠️ Complex |
| Local development | ✅ Recommended | ❌ N/A | ❌ N/A |
| CI/CD | ✅ Recommended | ❌ N/A | ✅ Alternative |

### Best Practices

1. **Initial Setup**: Use CLI + Dashboard combination
   ```bash
   railway init           # CLI to create project
   railway open          # Use Dashboard to connect GitHub
   ```

2. **Daily Development**: Use CLI
   ```bash
   railway run npm run dev
   railway logs --follow
   ```

3. **Deployment**: Push to GitHub, Railway auto-deploys

4. **Domain/Advanced Config**: Use Dashboard

---

## Token Types

### User Token
- **Obtain**: `railway login --browserless`
- **Usage**: All permissions for personal account
- **Location**: `~/.railway/config.json`

### Team Token
- **Obtain**: Railway Dashboard → Team Settings → Tokens
- **Usage**: Team resource access
- **Suitable for**: Team collaboration

### Project Token
- **Obtain**: Railway Dashboard → Project Settings → Tokens
- **Usage**: Single project CI/CD
- **Limitation**: Only for that project and environment

**Recommendations:**
- Local development: User Token (CLI login)
- CI/CD: Project Token (environment variable)
- Team sharing: Team Token

---

## Important Notes

1. **Rate Limits**: Railway API has rate limits (10,000 requests per hour)
2. **Token Security**: Don't commit Tokens to version control
3. **Environment Variables**: Sensitive info should be set via environment variables, not hardcoded
4. **Auto Deploy**: After connecting GitHub, pushing to specified branch automatically triggers deployment

---

## References

- [Railway Public API Documentation](https://docs.railway.com/reference/public-api)
- [Railway GraphiQL Playground](https://railway.com/graphiql) - For testing API calls
- [Railway CLI Documentation](https://docs.railway.com/guides/cli)
- [Railway Dashboard](https://railway.com/dashboard)
- [Railway Templates](https://railway.com/templates)
- [Railway Discord Community](https://discord.gg/railway)
