# Agent Tech Stack Guidance CLI

A command-line tool designed to help developers and agents easily add "guidance" documentation to their projects. This tool bundles a collection of best-practice guides for various technologies (Vercel, Supabase, etc.) and allows you to inject them into your project's `.agent_guidance` directory.

## Features

- **Init**: Sets up a `.agent_guidance` directory with a manifest of available guides.
- **Add**: specific guides to your project with a single command.
- **Search**: Supports prefix matching (e.g., `add ver` finds `vercel`).
- **Language Support**: Specify your preferred language (defaults to English, falls back to English if the requested language isn't available).

## Usage

You can use this tool directly with `npx` or install it globally.

### Using npx (Recommended)

**Initialize your project:**
```bash
npx agent-tech-stack-guidance init
```
This creates a `.agent_guidance` folder and a `guidance_list.md` file.

**Add a guide:**
```bash
npx agent-tech-stack-guidance add vercel
```

**Add a guide in a specific language:**
```bash
npx agent-tech-stack-guidance add supabase --lang zh
```

### Global Installation

```bash
npm install -g agent-tech-stack-guidance
```

Then run:
```bash
agent-guidance init
agent-guidance add vercel
```

## Contributing

We welcome contributions! Whether you want to add a new guide, improve an existing one, or enhance the CLI tool itself.

### Adding a New Guide

1.  **Fork the repository**.
2.  **Create your guide**:
    *   Navigate to `.agent/<lang>/` (e.g., `.agent/en/`).
    *   Create a markdown file named `<tech>_guide_<lang>.md` (e.g., `mytech_guide_en.md`).
    *   Ensure the content provides clear, agent-friendly instructions.
3.  **Test locally**:
    *   Run `npm link` in the root of your forked repo.
    *   Create a temporary folder elsewhere and run `agent-guidance add mytech`.
    *   Verify the file is copied correctly.
4.  **Submit a Pull Request**.

### Updating the CLI Logic

1.  Clone the repo.
2.  Install dependencies: `npm install`.
3.  Make your changes in `lib/` or `bin/`.
4.  Test your changes locally.

### Publishing (For Maintainers)

If you are a maintainer, here is how to publish a new version to npm after merging PRs:

1.  **Pull the latest changes**: `git pull origin main`.
2.  **Update Version**:
    ```bash
    npm version patch # or minor/major
    ```
3.  **Publish**:
    ```bash
    npm publish
    ```
4.  **Push tags**:
    ```bash
    git push --follow-tags
    ```

## License

MIT
