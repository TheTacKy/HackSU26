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

In another terminal, install and start the Python backend:

```bash
cd backend
pip install -r requirements.txt
python run.py
```

The frontend runs at `http://localhost:5173` and the backend runs at `http://localhost:8000`.

## API Keys Needed

Create a file named `.env` inside the `backend` directory:

```env
GITHUB_TOKEN=your_github_token
OPENAI_API_KEY=your_openai_api_key
REDIS_URL=redis://localhost:6379/0
```

