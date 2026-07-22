# Repo Scout

A web app that matches developers with open source GitHub repositories based on their interests, coding language, and experience level. Repo Scout extracts keywords locally, searches GitHub for relevant repositories, and uses OpenAI to rank them.

## The Process

When a user inputs their description, interests, coding languages, and experience level, here's what happens in the backend:

1. **Keyword Extraction**: A lightweight local extractor identifies relevant topics in the user's interests description.

2. **Repository Search (GitHub API)**: The system searches GitHub repositories using the extracted keywords and user's coding languages, filtering for active, public repositories with issues enabled.

3. **Repository Ranking (OpenAI Call)**: All found repositories are ranked by OpenAI based on how well they match the user's interests, coding languages, and skill level.

4. **Issue Discovery**: Open issues are fetched in parallel for each repository, prioritizing "good first issue" or "help wanted" labels based on user experience.

5. **Recommendation Generation**: Final recommendations are compiled with repository metadata and issues, then returned to the frontend.

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

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the `backend/` directory:
   ```env
   GITHUB_TOKEN=your_github_token_here
   OPENAI_API_KEY=your_openai_api_key_here
   REDIS_URL=redis://localhost:6379/0
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

The backend API will be available at `http://localhost:8000`

**Note:** The backend requires all API keys to function properly. Make sure your `.env` file is properly configured before starting the server.

## Project Structure

- `backend/` - TypeScript/Fastify backend application
  - `src/` - API routes and business logic
  - `test/` - Backend unit tests
- `frontend/` - React application with Tailwind CSS 3
  - `src/components/` - React components
  - `src/lib/` - Utility functions and libraries
  - `src/pages/` - Page components
  - `src/store/` - State management

