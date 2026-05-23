# Reviewer v1.0.0

Automatic review assistant for Pull Requests in Gitea using AI.

## Requirements

- Node.js 22+
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

The server listens on `http://localhost:4000` by default and exposes `POST /review`.

### Runtime Endpoints

- `POST /review` accepts the Gitea webhook payload for review events.
- Requests to `POST /review` are signature validated.

### Deployment

The simplest production setup is:

```bash
pnpm install
pnpm build
pnpm start
```

For Docker-based deployment:

```bash
docker build -t gitea-reviewer .
docker run --env-file .env -p 4000:4000 gitea-reviewer
```

## License and Attribution

This project is distributed under **GNU General Public License v3.0 or later** (see [LICENSE](LICENSE)).

You can use, modify and redistribute the code, but you must maintain attribution to the original project in the source code and/or distribution documentation.

Suggested attribution reference:

> Based on the original **reviewer** project.
