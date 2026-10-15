# Repo Scout

## Project Description

Repo Scout helps developers find open-source GitHub repositories that match their interests, preferred programming languages, and experience level. It searches GitHub for active repositories, ranks the results, and displays relevant open issues.

## How to Run

Install and start the frontend:

```bash
cd frontend
npm install
npm run dev
```

Use Node.js 24. In another terminal, install and start the TypeScript backend:

```bash
cd backend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and the backend runs at `http://localhost:8000`.

## API Keys Needed

Create a file named `.env` inside the `backend` directory:

```env
GITHUB_TOKEN=your_github_token
OPENAI_API_KEY=your_openai_api_key
REDIS_URL=redis://localhost:6379/0
```

To run the entire backend test suite:

```bash
npm --prefix backend test
```

## Lambda deployment preparation

The Docker image includes AWS Lambda Web Adapter, which forwards Lambda HTTP
invocations to the existing Fastify server on port 8000. It waits for `/health`
to return 200 before forwarding requests. React is served by the same server,
so frontend API requests use the same origin. Redis is disabled in the image
unless `REDIS_URL` is explicitly configured.

Build an x86_64 image for Lambda:

```bash
docker build --platform linux/amd64 --provenance=false -t repo-scout:test .
docker run --rm --read-only --tmpfs /tmp -p 8000:8000 repo-scout:test
```

Open `http://localhost:8000`. Real searches require `GITHUB_TOKEN` and
`OPENAI_API_KEY` as runtime environment variables; never bake them into the image.
The read-only filesystem check matches Lambda's restriction: only `/tmp` is writable.

The planned AWS region is `us-west-2` (Oregon), with ECR and Lambda in the same
region and Lambda configured for x86_64. This prepares the image only: AWS
resources and the deployment workflow still need to be configured. CI's Docker
smoke test checks the HTTP server, not the Lambda invocation protocol; a real
Lambda deployment must also be tested.
