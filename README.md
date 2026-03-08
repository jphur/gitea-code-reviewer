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

2. Create a `.env` file with:


GITEA_URL=http://your-gitea-instance
GITEA_TOKEN=your_token
GOOGLE_GENERATIVE_AI_API_KEY=secret
```

3. Run the service (in production mode):

```bash
pnpm start          # compiles and runs dist/main.js
```

During development you can start with automatic reload:

```bash
pnpm dev            # uses tsx to run src/main.ts directly
```

You also have an independent build command:

```bash
pnpm run build      # generates JavaScript files in ./dist
```

There's a basic test script that you can extend later:

```bash
pnpm test           # currently prints a message, add your tests here
```

The server listens on `http://localhost:4000` and exposes `POST /review` for Gitea webhooks.

### Environment Variables

Copy `.env.example` to `.env` and fill in the necessary variables:

```bash
cp .env.example .env
# edit .env with your values
```

The main keys are as follows (there are more options and some have default values):

- `GITEA_URL` – base URL of your Gitea instance
- `GITEA_TOKEN` – token with read/write permissions on PRs
- `BOT_NAME` – username of the automatic reviewer that must match `requested_reviewer.username` in the webhook (default `AI`)
- `GOOGLE_GENERATIVE_AI_API_KEY` – credentials for the AI provider
- `PORT` and `ENDPOINT` – where the server listens (4000 and 0.0.0.0 by default)
- `REQUEST_CHANGES_THRESHOLD` – numeric threshold (default 8) below which the bot uses the `REQUEST_CHANGES` event instead of `COMMENT`

## License and Attribution

This project is distributed under **BSD 3-Clause License** (see [LICENSE](LICENSE)).

You can use, modify and redistribute the code, but you must maintain attribution to the original project in the source code and/or distribution documentation.

Suggested attribution reference:

> Based on the original **reviewer** project.