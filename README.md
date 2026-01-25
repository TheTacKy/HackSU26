# Repo Scout

A web app that matches developers with open source GitHub repositories based on their interests, coding language, and experience level. Repo Scout uses OpenAI to extract keywords from user interests, searches GitHub for relevant repositories, and intelligently ranks them to help developers find the perfect projects to contribute to.

## Features

- **AI-Powered Keyword Extraction**: Uses OpenAI to extract relevant keywords from natural language descriptions
- **Smart Repository Matching**: Searches GitHub repositories based on coding languages, interests, and activity level
- **Intelligent Ranking**: AI-powered ranking system that considers user profile, interests, and skill level
- **Issue Discovery**: Automatically fetches "good first issue" and "help wanted" labels for each repository
- **Modern UI**: Beautiful, responsive interface built with React and Tailwind CSS

## Setup

### Frontend

In `frontend/`, run:
```bash
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Backend

In `backend/`, run:

1. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   ```
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Create a `.env` file in the `backend/` directory with your API keys:
   ```env
   GITHUB_TOKEN=your_github_token_here
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. Run the backend server:
   ```bash
   python run.py
   ```

The backend API will be available at `http://localhost:8000`

**Note:** The backend requires all API keys to function properly. Make sure your `.env` file is properly configured before starting the server.

## Project Structure

- `backend/` - FastAPI backend application
  - `app/agents/` - AI agents
  - `app/services/` - Business logic services
- `frontend/` - React application with Tailwind CSS 3
  - `src/components/` - React components
  - `src/lib/` - Utility functions and libraries
  - `src/pages/` - Page components
  - `src/store/` - State management

