# Repo Scout

## Project Description

Repo Scout helps developers find active open-source GitHub repositories based on their interests, programming languages, and experience. It ranks matching repositories and displays relevant open issues.

## How to Run

Start the frontend:

```bash
cd frontend
npm install
npm run dev
```

In another terminal, start the TypeScript backend:

```bash
cd backend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173`. The backend runs at `http://localhost:8000`.

## API Keys Needed


Create `backend/.env`:

```env
GITHUB_TOKEN=your_github_token
OPENAI_API_KEY=your_openai_api_key
REDIS_URL=redis://localhost:6379/0
```

No API key names need to change. `REDIS_URL` is optional and points to the local or deployed Redis instance.

## Basic Unit Tests

From the project root, run:

```bash
npm --prefix backend run test:basic
```

On PowerShell, use `npm.cmd` instead of `npm` if script execution is disabled.

The beginner-friendly tests in `backend/test/ranking.test.ts` check repository
ordering, duplicate/invalid indexes, empty rankings, and empty repository lists.
They use Vitest and run locally without API requests, API keys, or Redis.
The first example follows **Arrange** (input), **Act** (call the function), and
**Assert** (check the expected result).

To run the entire backend test suite:

```bash
npm --prefix backend test
```
