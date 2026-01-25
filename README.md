# Repo Scout

A web app that matches developers with open source GitHub repositories based on their interests, coding language, and experience level. Repo Scout uses OpenAI to extract keywords from user interests, searches GitHub for relevant repositories, and intelligently ranks them to help developers find the perfect projects to contribute to.

## The Process

When a user inputs their description, interests, coding languages, and experience level, here's what happens in the backend:

1. **Keyword Extraction (1st AI Call)**: OpenAI extracts relevant keywords from the user's interests description.

2. **Repository Search (GitHub API)**: The system searches GitHub repositories using the extracted keywords and user's coding languages, filtering for active, public repositories with issues enabled.

3. **Repository Ranking (2nd AI Call)**: All found repositories are ranked by OpenAI based on how well they match the user's interests, coding languages, and skill level.

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

