# Quick Start Guide - 5 Minutes to Go!

## TL;DR - Get Started in 5 Steps

### Step 1: Get OpenAI API Key (2 minutes)
1. Visit https://platform.openai.com/account/api-keys
2. Sign up or log in
3. Create a new API key
4. Copy your API key

### Step 2: Configure Backend (1 minute)
1. Open terminal in `backend` folder
2. Create `.env` file:
   ```bash
   echo OPENAI_API_KEY=your_key_here > .env
   ```
3. Replace `your_key_here` with your actual API key

### Step 3: Start Backend (1 minute)
```bash
cd backend
python run.py
```
✅ Backend running at `http://localhost:8000`

### Step 4: Start Frontend (1 minute)
Open new terminal:
```bash
cd frontend
npm install  # if needed
npm run dev
```
✅ Frontend running at `http://localhost:5173`

### Step 5: Test Features (1 minute)
1. Open `http://localhost:5173` in browser
2. Click "Code of Conduct" → See the new page
3. Click "Get Started" → Go to search
4. Click "AI Recommendations" tab
5. Fill form and click "Get AI Recommendations"
6. 🎉 See ChatGPT recommendations!

---

## What You Just Built

### Feature 1: Code of Conduct Page
- Professional guide for open source contributors
- Best practices and community standards
- Available at `/code-of-conduct`

### Feature 2: AI Recommendations
- ChatGPT-powered repository suggestions
- Based on interests, skills, and experience
- 5-7 personalized recommendations per request

---

## File Structure

```
HackSU26/
├── backend/
│   ├── .env                    ← Add your OpenAI API key here
│   ├── requirements.txt
│   ├── run.py
│   └── app/
│       ├── main.py             ← Updated with new endpoint
│       ├── schemas.py          ← Updated with new schema
│       └── agents/
│           └── recommendation_agent.py  ← New AI agent
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx             ← Updated with route
│   │   ├── pages/
│   │   │   ├── Home.jsx        ← Updated with link
│   │   │   ├── Search.jsx      ← Updated with tabs
│   │   │   └── CodeOfConduct.jsx   ← New page
│   │   └── components/
│   │       └── RecommendationsComponent.jsx  ← New component
│   └── package.json
│
├── FEATURES.md                 ← Feature documentation
├── SETUP.md                    ← Detailed setup guide
├── USER_GUIDE.md              ← User journey guide
├── IMPLEMENTATION.md          ← Technical details
└── CHECKLIST.md              ← Status checklist
```

---

## Common Commands

### Backend
```bash
# Start backend
python run.py

# Install packages
pip install -r requirements.txt

# Test API endpoint
curl -X POST http://localhost:8000/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "interests": "Web Development",
    "skills": "Python, JavaScript",
    "experience_level": "intermediate"
  }'
```

### Frontend
```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

---

## Troubleshooting (30 seconds)

### Backend won't start
```bash
# Install dependencies
pip install -r requirements.txt

# Check .env file exists
cat .env  # Should show OPENAI_API_KEY=...
```

### Frontend shows error
```bash
# Install npm packages
npm install

# Clear cache and restart
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### No recommendations appear
- Check backend is running at `http://localhost:8000`
- Verify OpenAI API key in `.env`
- Check browser console for errors (F12)
- Ensure `.env` is in backend folder

---

## Architecture at a Glance

```
User → Frontend Form → Backend API → ChatGPT → Results
                                      ↓
                                  Recommendations
```

1. User fills form with interests, skills, experience
2. Frontend sends to `/recommendations` endpoint
3. Backend calls ChatGPT with user profile
4. ChatGPT returns repository suggestions
5. Frontend displays results in nice cards

---

## Features Summary

### Code of Conduct ✨
- **Access**: Click "Code of Conduct" on home page
- **Content**: 
  - Community pledge
  - Standards (good & bad behavior)
  - Enforcement & reporting
  - Contributing guidelines
  - Attribution
- **Benefits**: 
  - New contributors learn expectations
  - Community standards clearly defined
  - Safe reporting mechanisms

### AI Recommendations 🤖
- **Access**: Search page → AI Recommendations tab
- **How**: Fill form with 3 fields
- **Get**: 5-7 personalized recommendations
- **Info per repo**: Name, description, why it fits, first contribution, difficulty
- **Benefits**:
  - Quick discovery
  - Personalized suggestions
  - Clear next steps
  - No manual searching

---

## Next Steps

### Immediately After Setup
1. ✅ Test both features
2. ✅ Read the documentation
3. ✅ Share with team

### Within a Week
- Deploy to staging server
- Monitor API usage
- Collect user feedback
- Fix any bugs

### Within a Month
- Deploy to production
- Monitor costs
- Plan enhancements
- Consider caching

---

## Key Files to Know

| File | Purpose |
|------|---------|
| `backend/.env` | OpenAI API key (CREATE THIS) |
| `backend/app/main.py` | Backend API endpoints |
| `backend/app/agents/recommendation_agent.py` | ChatGPT integration |
| `frontend/src/pages/CodeOfConduct.jsx` | Code of Conduct page |
| `frontend/src/components/RecommendationsComponent.jsx` | Recommendations UI |
| `frontend/src/pages/Search.jsx` | Search page with tabs |

---

## Environment Variables

### Required
```
OPENAI_API_KEY=your_openai_api_key_here
```

### Optional (for production)
```
OPENAI_API_TIMEOUT=30
OPENAI_API_MAX_RETRIES=3
```

---

## URLs Reference

| Page | URL |
|------|-----|
| Home | http://localhost:5173 |
| Code of Conduct | http://localhost:5173/code-of-conduct |
| Search (Matching) | http://localhost:5173/search (Profile Matching tab) |
| Search (AI) | http://localhost:5173/search (AI Recommendations tab) |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

---

## Example Usage

### User Journey
```
1. Visit home page
2. Click "Code of Conduct" → Learn community standards
3. Click "Get Started" → Go to search
4. Fill AI Recommendations form:
   - Interests: "Web Development, Python"
   - Skills: "Python, JavaScript, React"
   - Experience: "Intermediate"
5. Click "Get AI Recommendations"
6. Wait for results (3-10 seconds)
7. See 5-7 recommended repositories
8. Click on one you like
9. Check the recommendation reasoning
10. Start contributing!
```

---

## Cost Considerations

### OpenAI API Usage
- Each recommendation request uses API tokens
- Typical request: 500-1000 tokens
- Check usage: https://platform.openai.com/account/usage
- Cost: ~$0.002 - $0.01 per recommendation

### Cost Optimization
- Cache frequently requested profiles
- Implement rate limiting (e.g., 5 requests/minute)
- Monitor usage and adjust model if needed

---

## Support

### Documentation
- 📖 [FEATURES.md](FEATURES.md) - Complete feature guide
- 🚀 [SETUP.md](SETUP.md) - Setup instructions
- 👤 [USER_GUIDE.md](USER_GUIDE.md) - User guide
- 🔧 [IMPLEMENTATION.md](IMPLEMENTATION.md) - Technical details
- ✅ [CHECKLIST.md](CHECKLIST.md) - Project checklist

### Quick Links
- OpenAI API: https://platform.openai.com
- FastAPI Docs: https://fastapi.tiangolo.com
- React Docs: https://react.dev
- Tailwind CSS: https://tailwindcss.com

---

## You're All Set! 🎉

You now have:
✅ Code of Conduct page for your contributors
✅ AI-powered repository recommendations
✅ Complete, production-ready implementation
✅ Comprehensive documentation
✅ Everything needed to get started

### What to do next:
1. Test it out
2. Show it to your team
3. Deploy when ready
4. Start improving based on feedback

**Happy hacking!** 🚀

---

*Questions? See [FEATURES.md](FEATURES.md) for detailed docs*
