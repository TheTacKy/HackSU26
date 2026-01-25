# Setup Guide for New Features

## Quick Start

### Prerequisites
- Python 3.8+
- Node.js 14+
- OpenAI API key (from https://platform.openai.com/account/api-keys)

### Step 1: Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create `.env` file with your OpenAI API key:
```bash
echo OPENAI_API_KEY=your_api_key_here > .env
```

3. Install dependencies (if not already done):
```bash
pip install -r requirements.txt
```

4. Run the backend server:
```bash
python run.py
```

The backend will start at `http://localhost:8000`

### Step 2: Frontend Setup

1. In a new terminal, navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies (if not already done):
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will start at `http://localhost:5173`

### Step 3: Test the Features

1. **Access the Code of Conduct**:
   - Go to http://localhost:5173
   - Click "Code of Conduct" in the navigation menu
   - Or directly visit http://localhost:5173/code-of-conduct

2. **Test AI Recommendations**:
   - Go to http://localhost:5173/search
   - Click on "AI Recommendations" tab
   - Fill in your interests, skills, and experience level
   - Click "Get AI Recommendations"
   - Wait for ChatGPT to return personalized suggestions

---

## Configuration

### OpenAI API Key

The feature requires an OpenAI API key. To get one:

1. Visit https://platform.openai.com/account/api-keys
2. Sign up or log in to your OpenAI account
3. Create a new API key
4. Add it to `backend/.env`:
```
OPENAI_API_KEY=sk-...your-key-here...
```

### CORS Configuration

CORS is already configured to allow requests from:
- `http://localhost:5173` (frontend dev server)
- `http://127.0.0.1:5173`

To add additional origins, modify `backend/app/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "YOUR_NEW_ORIGIN"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)
```

---

## API Usage

### Code of Conduct Endpoint
**Route**: `/code-of-conduct`
**Method**: GET (Frontend route, no backend endpoint needed)

### Recommendations Endpoint
**Route**: `/recommendations`
**Method**: POST
**Body**:
```json
{
  "interests": "string",
  "skills": "string", 
  "experience_level": "beginner|intermediate|advanced"
}
```

**Response**:
```json
{
  "status": "success",
  "data": [
    {
      "name": "owner/repo",
      "description": "...",
      "fit": "...",
      "firstContribution": "...",
      "difficulty": "Beginner|Intermediate|Advanced"
    }
  ]
}
```

---

## Troubleshooting

### Backend won't start

**Error**: `ModuleNotFoundError: No module named 'openai'`
```bash
pip install -r requirements.txt
```

**Error**: `Uvicorn is not installed`
```bash
pip install uvicorn
```

### Frontend won't start

**Error**: `npm: command not found`
- Install Node.js from https://nodejs.org/

**Error**: Module not found
```bash
npm install
```

### API Key Issues

**Error**: `401 Unauthorized`
- Verify API key is correct in `.env`
- Check OpenAI account has available credits
- Ensure key hasn't expired

**Error**: `Failed to get recommendations`
- Check backend is running at `http://localhost:8000`
- Verify `.env` file exists in backend directory
- Check backend logs for error messages

### CORS Issues

**Error**: `Access to XMLHttpRequest blocked by CORS policy`
- Ensure backend is running
- Check frontend URL is in CORS allowed origins
- Try restarting both servers

---

## Testing

### Manual Testing

1. **Code of Conduct Page**:
   - Navigate to `/code-of-conduct`
   - Verify all sections load correctly
   - Check links are clickable

2. **AI Recommendations**:
   - Fill in sample interests: "Web Development, Machine Learning"
   - Fill in sample skills: "Python, JavaScript, React"
   - Select experience level
   - Click submit and wait for results
   - Verify recommendations appear

### Using cURL

Test the recommendations endpoint:

```bash
curl -X POST http://localhost:8000/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "interests": "Web Development, Machine Learning",
    "skills": "Python, JavaScript",
    "experience_level": "intermediate"
  }'
```

---

## Production Deployment

### Before Deploying

1. **Update CORS origins** in `backend/app/main.py`
2. **Use environment variables** for API keys (never hardcode)
3. **Enable HTTPS** in production
4. **Add rate limiting** to prevent API abuse
5. **Cache recommendations** to reduce API costs

### Example Rate Limiting

Add to `backend/app/main.py`:

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/recommendations")
@limiter.limit("5/minute")
def get_recommendations(request: RecommendationRequest):
    # ... implementation
```

### Docker Deployment

Example Dockerfile for backend:

```dockerfile
FROM python:3.9

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

ENV OPENAI_API_KEY=${OPENAI_API_KEY}

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the main [FEATURES.md](FEATURES.md) documentation
3. Check OpenAI API status: https://status.openai.com/
4. Review FastAPI docs: https://fastapi.tiangolo.com/
5. Review React docs: https://react.dev/

---

## Next Steps

After setup:
1. Customize the Code of Conduct content to match your project
2. Test recommendations with various input profiles
3. Consider implementing caching for frequently requested recommendations
4. Add user feedback mechanism to improve recommendations
5. Monitor OpenAI API costs and usage
