# HackSU26

Welcome to HackSU26 - Your AI-powered guide to finding the perfect open source projects to contribute to!

## ✨ Features

### 1. 📋 Code of Conduct Page (NEW!)
A comprehensive guide to community standards and best practices for open source contributions.
- **Access**: `/code-of-conduct`
- **Content**: Standards, guidelines, reporting mechanisms
- **Benefits**: Educates contributors on community expectations

### 2. 🤖 ChatGPT-Powered Recommendations (NEW!)
AI-powered repository suggestions based on your interests, skills, and experience level.
- **Access**: Search page → "AI Recommendations" tab
- **How it works**: Fill a simple form, get 5-7 personalized recommendations
- **Benefits**: Quick discovery of perfect repositories for your skill level

### 3. 🔍 Profile Matching
Traditional search and matching based on detailed user profiles.
- **Access**: Search page → "Profile Matching" tab
- **Features**: GitHub integration, good first issues, issue tracking

## 🚀 Quick Start (5 Minutes)

### 1. Get OpenAI API Key
Visit https://platform.openai.com/account/api-keys and create an API key

### 2. Setup Backend
```bash
cd backend
echo OPENAI_API_KEY=your_key_here > .env
python run.py
```

### 3. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Visit
Open http://localhost:5173 and explore!

**For detailed setup instructions, see [QUICKSTART.md](QUICKSTART.md)**

## 📚 Documentation

- [QUICKSTART.md](QUICKSTART.md) - 5-minute setup guide
- [FEATURES.md](FEATURES.md) - Complete feature documentation  
- [SETUP.md](SETUP.md) - Detailed setup and configuration
- [USER_GUIDE.md](USER_GUIDE.md) - User journey and usage
- [IMPLEMENTATION.md](IMPLEMENTATION.md) - Technical details
- [CHECKLIST.md](CHECKLIST.md) - Project status
- [SUMMARY.md](SUMMARY.md) - Implementation summary

## 🛠️ Full Setup

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

5. Create `.env` file with your OpenAI API key:
   ```bash
   echo OPENAI_API_KEY=your_openai_api_key_here > .env
   ```

6. Run the backend server:
   ```bash
   python run.py
   ```

   The backend API will be available at `http://localhost:8000`

## 📁 Project Structure

```
HackSU26/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── RecommendationsComponent.jsx (NEW!)
│   │   ├── pages/
│   │   │   ├── Home.jsx (updated)
│   │   │   ├── Search.jsx (updated)
│   │   │   └── CodeOfConduct.jsx (NEW!)
│   │   ├── App.jsx (updated)
│   │   └── ...
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── app/
│   │   ├── agents/
│   │   │   └── recommendation_agent.py (enhanced)
│   │   ├── main.py (updated)
│   │   ├── schemas.py (updated)
│   │   └── ...
│   ├── requirements.txt
│   ├── .env (CREATE THIS)
│   └── run.py
│
├── QUICKSTART.md (NEW!)
├── FEATURES.md (NEW!)
├── SETUP.md (NEW!)
├── USER_GUIDE.md (NEW!)
├── IMPLEMENTATION.md (NEW!)
├── CHECKLIST.md (NEW!)
├── SUMMARY.md (NEW!)
└── README.md (this file)
```

## 🌐 API Endpoints

### POST /match
```bash
curl -X POST http://localhost:8000/match \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John",
    "tech_stack": ["Python", "JavaScript"],
    "skill_level": "intermediate",
    "interests": ["Web Development"],
    "open_source_experience": "some",
    "occupation": "developer",
    "contribution_type": "code"
  }'
```

### POST /recommendations (NEW!)
```bash
curl -X POST http://localhost:8000/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "interests": "Web Development, Machine Learning",
    "skills": "Python, JavaScript, React",
    "experience_level": "intermediate"
  }'
```

## 🔧 Configuration

### Required Environment Variables
```
OPENAI_API_KEY=your_openai_api_key_here
```

### Optional Configuration
- `OPENAI_API_TIMEOUT=30` - API timeout in seconds
- `OPENAI_API_MAX_RETRIES=3` - Max retries for API calls

For more configuration options, see [SETUP.md](SETUP.md)

## 🧪 Testing

### Test Code of Conduct Page
1. Navigate to http://localhost:5173/code-of-conduct
2. Verify all sections display correctly
3. Check navigation and links work

### Test AI Recommendations
1. Go to http://localhost:5173/search
2. Click "AI Recommendations" tab
3. Fill the form:
   - Interests: "Web Development, Python"
   - Skills: "Python, JavaScript"
   - Experience: "Intermediate"
4. Click "Get AI Recommendations"
5. Wait for ChatGPT results to display

## 🐛 Troubleshooting

### Backend won't start
```bash
# Install missing dependencies
pip install -r requirements.txt

# Verify .env file
cat .env  # Should show OPENAI_API_KEY=...
```

### Frontend shows "Failed to get recommendations"
- Verify backend is running at http://localhost:8000
- Check OpenAI API key is valid in `.env`
- See browser console (F12) for error details

### CORS errors
- Ensure both frontend and backend are running
- Check frontend URL matches CORS config in main.py
- Restart both servers

For more help, see [SETUP.md](SETUP.md) troubleshooting section

## 📊 Project Statistics

- **New Components**: 2 (Code of Conduct page, Recommendations UI)
- **New Endpoints**: 1 (/recommendations)
- **Code Lines**: 1600+ (including documentation)
- **Documentation Files**: 7 (comprehensive guides)
- **Setup Time**: ~5 minutes (with Quick Start guide)

## 🎯 Use Cases

### For New Contributors
- Learn about community standards (Code of Conduct)
- Find perfect repositories (AI Recommendations)
- Get clear guidance on first contributions
- Start contributing confidently

### For Project Maintainers
- Automated repository recommendations
- Community standards clearly defined
- Better contributor quality
- Reduced onboarding friction

## 🚀 Next Steps

1. **Quick Start**: See [QUICKSTART.md](QUICKSTART.md) to get running in 5 minutes
2. **Learn Features**: Read [FEATURES.md](FEATURES.md) for detailed documentation
3. **Explore Usage**: Check [USER_GUIDE.md](USER_GUIDE.md) for user journeys
4. **Deploy**: Follow [SETUP.md](SETUP.md) for production deployment

## 📞 Support

### Documentation
- [QUICKSTART.md](QUICKSTART.md) - Fast setup
- [FEATURES.md](FEATURES.md) - Feature details
- [SETUP.md](SETUP.md) - Configuration
- [USER_GUIDE.md](USER_GUIDE.md) - Usage guide
- [IMPLEMENTATION.md](IMPLEMENTATION.md) - Technical info

### External Resources
- [OpenAI API Docs](https://platform.openai.com/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Contributor Covenant](https://www.contributor-covenant.org/)

## 📄 License

[Add your license information here]

## 👥 Contributors

Built with ❤️ for the open source community

---

**Ready to get started?** → [QUICKSTART.md](QUICKSTART.md)
