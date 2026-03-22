# Reviewer v1.0.0-alpha

Automatic review assistant for Pull Requests in Gitea using AI.

## Requirements

- Node.js 24+
- pnpm
- Gitea instance with API enabled
- Gitea token with permissions to read PRs and create reviews

## Configuration

1. Install dependencies:

```bash
pnpm install
```

2. Create a `.env` file from the example and fill in the values:

```bash
cp .env.example .env
```

3. Run the service:

```bash
pnpm start          # build + run dist/main.js
```

During development you can start with automatic reload:

```bash
pnpm dev            # uses tsx to run src/main.ts directly
```

You also have an independent build command:

```bash
pnpm run build      # generates JavaScript files in ./dist
```

And the test suite:

```bash
pnpm test           # runs vitest
```

The server listens on `http://localhost:4000` by default and exposes `POST /review` for Gitea webhooks.

### Environment Variables

Copy `.env.example` to `.env` and fill in the necessary variables:

```bash
cp .env.example .env
# edit .env with your values
```

The main keys are as follows (there are more options and some have default values):

- `GITEA_URL` – base URL of your Gitea instance
- `GITEA_TOKEN` – token with read/write permissions on PRs
- `GITEA_WEBHOOK_SECRET` – secret used to verify the `X-Gitea-Signature` header
- `BOT_NAME` – username of the automatic reviewer that must match `requested_reviewer.username` in the webhook (default `AI`)
- `GOOGLE_GENERATIVE_AI_API_KEY` – credentials for the AI provider
- `PORT` and `ENDPOINT` – where the server listens (4000 and 0.0.0.0 by default)
- `REQUEST_CHANGES_THRESHOLD` – numeric threshold (default 8) below which the bot uses the `REQUEST_CHANGES` event instead of `APPROVE`

### Known Limitations

- The bot only reacts to `review_requested` webhook events.
- A single AI provider is configured.
- There is no retry queue for Gitea or model failures.
- Reviews are processed inline in the webhook request path.
- The current schema expects the model to return structured review data that matches `src/schemas/review.ts`.

## License and Attribution

This project is distributed under **GNU General Public License v3.0 or later** (see [LICENSE](LICENSE)).

You can use, modify and redistribute the code, but you must maintain attribution to the original project in the source code and/or distribution documentation.

Suggested attribution reference:

> Based on the original **reviewer** project.
