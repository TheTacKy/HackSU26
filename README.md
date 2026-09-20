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
