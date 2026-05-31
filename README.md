# Reviewer

Automatic code review assistant for Pull Requests in Gitea using AI. Analyzes code changes and provides intelligent suggestions, automatically posting reviews back to your repository.

## Overview

**Reviewer** is a webhook-based service that integrates with Gitea to:
- Automatically analyze pull request diffs using AI models
- Generate code reviews with suggestions and quality scores
- Post reviews directly to Gitea (approve or request changes)
- Handle large diffs by splitting them into per-file reviews

The service connects to any AI model supported by the [Vercel AI SDK](https://sdk.vercel.ai/) (OpenAI, Anthropic, etc.).

## Requirements

- Node.js 22+
- pnpm
- Gitea instance with API enabled
- Gitea token with permissions to read PRs and create reviews
- AI model API key (OpenAI, Anthropic, or other compatible provider)

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Required variables:
- `GITEA_URL` - Base URL of your Gitea instance (e.g., `https://git.example.com`)
- `GITEA_TOKEN` - Personal access token with repo read/write permissions
- AI model configuration (depends on provider):
  - For OpenAI: `OPENAI_API_KEY`
  - For Anthropic: `ANTHROPIC_API_KEY`
  - etc.

Optional variables:
- `PORT` - Server port (default: `4000`)
- `FORCE_BY_FILE` - Always review files separately (default: `false`)
- `MAX_CHAR_DIFF` - Threshold to trigger per-file reviews (default: `50000`)
- `REQUEST_CHANGES_THRESHOLD` - Score threshold to request changes vs approve (default: `0.5`)
- `AI_MAX_OUTPUT_TOKENS` - Maximum tokens for AI output (default: `2000`)
- `AI_TIMEOUT_MS` - AI request timeout in milliseconds (default: `30000`)

### 3. Set up Gitea webhook

In your Gitea repository settings:
1. Go to **Settings** → **Webhooks** → **Add Webhook** → **Gitea**
2. Set the webhook URL: `https://your-reviewer-host/review`
3. Select event type: **Pull Request Events**
4. (Optional) Add secret for request signing

## Running

### Development

```bash
pnpm dev            # Hot reload with tsx
```

### Production build

```bash
pnpm build          # Compile TypeScript to ./dist
pnpm start          # Run compiled JavaScript
```

### Testing

```bash
pnpm test           # Run Vitest
```

## Architecture

- `src/api/` - Express server and middleware
- `src/core/` - Review logic and Gitea integration
- `src/schemas/` - Zod validation schemas for AI responses
- `src/resources/` - System prompts for the AI model

## Deployment

### Docker

Build and run with Docker:

```bash
docker build -t reviewer .
docker run --env-file .env -p 4000:4000 reviewer
```

### Manual

1. Clone and setup:
```bash
git clone <repository>
cd reviewer
pnpm install
pnpm build
```

2. Run:
```bash
pnpm start
```

The service will listen on `http://localhost:4000` and expose `POST /review` endpoint.

## How It Works

1. **Webhook Event**: Gitea sends a webhook event when a PR is opened/updated
2. **Diff Retrieval**: The service fetches the full diff from Gitea
3. **Review Generation**:
   - If diff is small: Sends entire diff to AI for analysis
   - If diff is large: Splits by file and analyzes each separately
4. **Post Review**: Aggregates AI suggestions into comments and posts back to Gitea

## Example

When a PR is opened with changes, Reviewer will:
- Analyze code quality
- Suggest improvements
- Assign a quality score
- Post comments on specific lines
- Automatically approve or request changes based on score

## License and Attribution

This project is distributed under **GNU General Public License v3.0 or later** (see [LICENSE](LICENSE)).

You can use, modify and redistribute the code, but you must maintain attribution to the original project in the source code and/or distribution documentation.

Suggested attribution reference:

> Based on the original **reviewer** project.
