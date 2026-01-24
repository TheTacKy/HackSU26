# HackSU26

## Setup

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:5173`

### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment (recommended):
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - Windows:
     ```bash
     venv\Scripts\activate
     ```
   - macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Run the backend server:
   ```bash
   python run.py
   ```

   The backend API will be available at `http://localhost:8000`

## Project Structure

- `frontend/` - React application with Tailwind CSS 3
  - `src/components/` - React components
  - `src/lib/` - Utility functions and libraries
  - `src/pages/` - Page components
  - `src/store/` - State management
- `backend/` - FastAPI backend application
  - `app/agents/` - AI agents
  - `app/services/` - Business logic services