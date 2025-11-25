# How to Publish `agent-guidance` to npm

This guide explains how to publish your CLI tool to the npm registry so others can install it using `npm install -g agent-tech-stack-guidance` or run it via `npx`.

## Prerequisites

1.  **npm Account**: You need an account on [npmjs.com](https://www.npmjs.com/).
2.  **Login**: Login to npm in your terminal:
    ```bash
    npm login
    ```

## Steps to Publish

1.  **Prepare the Package**:
    - Ensure `package.json` has the correct `name`, `version`, and `bin` configuration (Already done).
    - **Important**: The package name `agent-tech-stack-guidance` might be taken. You might want to scope it (e.g., `@your-username/agent-guidance`) or choose a unique name in `package.json`.

2.  **Publish**:
    Run the following command in the project root:
    ```bash
    npm publish
    ```
    
    If you are using a scoped package (e.g., `@bertramray/agent-guidance`), use:
    ```bash
    npm publish --access public
    ```

3.  **Update**:
    To publish a new version later:
    - Update the version in `package.json` (e.g., `1.0.1`).
    - Run `npm publish` again.

## Installation for Users

Once published, users can:

**Run without installing (recommended):**
```bash
npx agent-tech-stack-guidance init
npx agent-tech-stack-guidance add vercel
```

**Install globally:**
```bash
npm install -g agent-tech-stack-guidance
agent-guidance init
```

## Automated Publishing (GitHub Actions)

We have set up a GitHub Action to automatically publish to npm when you create a new release on GitHub.

### Setup (Trusted Publishing)

We use **NPM Trusted Publishing** (OIDC) to publish without long-lived tokens.

1.  Go to [npmjs.com](https://www.npmjs.com/) and log in.
2.  Navigate to your package settings (or your profile > Access > Provenance & Publishing).
3.  Click **"Add a new publisher"**.
4.  Select **GitHub**.
5.  Enter the repository owner and name: `BertramRay/agent-tech-stack-guidance`.
6.  Branch: `main` (or leave default if it asks for a workflow filename, usually it asks for repo/branch/workflow).
    *   *Note*: For releases, you might need to configure it to trust the release workflow or tag pattern. Usually, trusting the `publish.yml` workflow on the `main` branch or tags is sufficient.
    *   **Best Practice**: Configure it to trust **"Any tag"** or a specific tag pattern (e.g., `v*`) if possible, or trust the `publish.yml` workflow.

**No secrets needed!** You do *not* need to add `NPM_TOKEN` to GitHub secrets anymore.

### How to Release

### How to Release

1.  **Draft a new release** on GitHub.
2.  **Tag the release** (e.g., `v1.0.1`).
3.  **Publish**.
4.  The GitHub Action will:
    *   Automatically update the `package.json` version to match your tag (e.g., `1.0.1`).
    *   Publish the package to npm.

> **Note**: This keeps the published package version in sync with the GitHub release. However, your local `package.json` in the git repository will remain at the old version unless you manually update it. It is still good practice to run `npm version patch` locally and push, but the Action ensures the *published* artifact is always correct.

