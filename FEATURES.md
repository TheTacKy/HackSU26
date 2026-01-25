# New Features: Code of Conduct & AI-Powered Recommendations

## Overview
This document describes two new features added to HackSU26 to enhance the user experience:

1. **Code of Conduct Page** - A comprehensive guide for contributing to open source
2. **ChatGPT-Powered Recommendations** - AI-based repository recommendations based on user interests

---

## Feature 1: Code of Conduct Page

### What It Is
A dedicated page that outlines the code of conduct and best practices for contributing to open source projects. This helps new contributors understand community standards and expectations.

### Location
- **Route**: `/code-of-conduct`
- **Component**: [frontend/src/pages/CodeOfConduct.jsx](frontend/src/pages/CodeOfConduct.jsx)

### Features Included
- **Our Pledge**: Community values and commitment to inclusivity
- **Our Standards**: Examples of acceptable and unacceptable behavior
- **Enforcement Responsibilities**: How violations are handled
- **Scope**: Where the code of conduct applies
- **Reporting & Getting Help**: How to report issues
- **Contributing Guidelines**: Best practices for contributing to open source
- **Attribution**: Reference to Contributor Covenant

### How to Access
1. Navigate to the HackSU26 home page
2. Click "Code of Conduct" in the navigation menu
3. Or directly visit `/code-of-conduct`

### User Benefits
- First-time contributors can learn community expectations before contributing
- Promotes respectful and inclusive communication
- Provides clear guidance on reporting issues
- Sets expectations for professional interactions

---

## Feature 2: AI-Powered Repository Recommendations

### What It Is
A ChatGPT-powered feature that provides personalized repository recommendations based on user interests, skills, and experience level. This makes discovering relevant open source projects faster and more intuitive.

### Architecture

#### Backend
- **Agent**: [backend/app/agents/recommendation_agent.py](backend/app/agents/recommendation_agent.py)
- **Function**: `get_personalized_recommendations(interests: str, skills: str, experience_level: str)`
- **Endpoint**: `POST /recommendations`

#### Frontend
- **Component**: [frontend/src/components/RecommendationsComponent.jsx](frontend/src/components/RecommendationsComponent.jsx)
- **Integration**: Accessible via "AI Recommendations" tab on the Search page

### How It Works

#### Step 1: User Input
Users provide:
- **Interests/Technologies**: What they want to work with (e.g., "Web Development, Machine Learning")
- **Skills/Languages**: Programming languages and frameworks they know (e.g., "Python, React, Docker")
- **Experience Level**: Their proficiency (Beginner, Intermediate, Advanced)

#### Step 2: Processing
The backend calls ChatGPT's API with a carefully crafted prompt that:
1. Describes the user's profile to the AI
2. Requests 5-7 repository recommendations
3. Specifies JSON format for structured responses

#### Step 3: AI Response
ChatGPT returns recommendations with:
- Repository name (owner/repo format)
- Brief description
- Why it's a good fit for the user
- Suggested first contribution type
- Difficulty level (Beginner, Intermediate, Advanced)

#### Step 4: Display
Results are displayed in an easy-to-read card format with:
- Repository information
- Relevance explanation
- Next steps for the user
- Difficulty indicator

### API Endpoint

**Request**:
```bash
POST /recommendations
Content-Type: application/json

{
  "interests": "Web Development, Machine Learning",
  "skills": "Python, JavaScript, React",
  "experience_level": "intermediate"
}
```

**Response**:
```json
{
  "status": "success",
  "data": [
    {
      "name": "torvalds/linux",
      "description": "The Linux kernel source code",
      "fit": "Great for learning kernel development and contributing to foundational software",
      "firstContribution": "Documentation improvements or simple bug fixes",
      "difficulty": "Advanced"
    },
    ...
  ]
}
```

### Required Setup

#### Environment Variables
Add to [backend/.env](backend/.env):
```
OPENAI_API_KEY=your_openai_api_key_here
```

Get your API key from: https://platform.openai.com/account/api-keys

#### Installation
Backend dependencies are already in [requirements.txt](backend/requirements.txt):
```
openai
```

### How to Use

1. **Navigate to Search Page**: Click "Get Started" or visit `/search`

2. **Choose Tab**: Select "AI Recommendations" tab

3. **Fill Form**:
   - Enter your interests (technologies, domains)
   - Enter your skills (languages, frameworks)
   - Select your experience level

4. **Get Recommendations**: Click "Get AI Recommendations"

5. **Review Results**: Browse the recommended repositories with:
   - Why each is a good fit
   - Suggested first contribution type
   - Difficulty level

### Advantages Over Profile Matching

| Feature | Profile Matching | AI Recommendations |
|---------|------------------|-------------------|
| **Input Required** | Extensive profile info | Simple interests/skills |
| **Process** | GitHub search + matching | ChatGPT analysis |
| **Speed** | Slower (API calls, matching) | Faster (single API call) |
| **Relevance** | Database-based | AI-powered, contextual |
| **New Projects** | Only indexed projects | Can recommend new/lesser-known |
| **Personalization** | Based on hard criteria | Conversational understanding |

### Implementation Details

#### Code Flow

1. **Frontend** (`RecommendationsComponent.jsx`):
   - User fills form with interests, skills, experience level
   - Form submitted to POST `/recommendations`
   - Results displayed in card layout

2. **Backend** (`main.py`):
   - Receives `RecommendationRequest`
   - Calls `get_personalized_recommendations()` from recommendation_agent
   - Returns results as JSON

3. **AI Agent** (`recommendation_agent.py`):
   - Constructs detailed prompt for ChatGPT
   - Sends request to OpenAI API
   - Parses JSON response
   - Handles fallback if parsing fails

#### Error Handling

The component handles:
- Network errors
- API failures
- Invalid responses
- Missing environment variables

---

## Updated Files

### New Files
1. [frontend/src/pages/CodeOfConduct.jsx](frontend/src/pages/CodeOfConduct.jsx) - Code of Conduct page
2. [frontend/src/components/RecommendationsComponent.jsx](frontend/src/components/RecommendationsComponent.jsx) - AI recommendations UI

### Modified Files
1. [frontend/src/App.jsx](frontend/src/App.jsx) - Added route for CodeOfConduct
2. [frontend/src/pages/Home.jsx](frontend/src/pages/Home.jsx) - Added navigation link
3. [frontend/src/pages/Search.jsx](frontend/src/pages/Search.jsx) - Added AI recommendations tab
4. [backend/app/main.py](backend/app/main.py) - Added /recommendations endpoint
5. [backend/app/schemas.py](backend/app/schemas.py) - Added RecommendationRequest schema
6. [backend/app/agents/recommendation_agent.py](backend/app/agents/recommendation_agent.py) - Added get_personalized_recommendations function

---

## Usage Examples

### Example 1: Web Developer
**User Input**:
- Interests: "Web Development, Open Source"
- Skills: "JavaScript, React, Node.js"
- Experience: "Intermediate"

**Possible Recommendations**:
- facebook/react
- vercel/next.js
- tailwindlabs/tailwindcss

### Example 2: Data Scientist
**User Input**:
- Interests: "Machine Learning, Data Analysis"
- Skills: "Python, TensorFlow, Pandas"
- Experience: "Advanced"

**Possible Recommendations**:
- tensorflow/tensorflow
- scikit-learn/scikit-learn
- huggingface/transformers

---

## Troubleshooting

### Issue: "No recommendations returned"
**Solution**: 
- Ensure `OPENAI_API_KEY` is set in `.env`
- Check API key validity
- Verify OpenAI account has available credits

### Issue: "Error: 401 Unauthorized"
**Solution**: 
- Verify API key is correct
- Check API key has appropriate permissions
- Ensure .env file is in backend directory

### Issue: "CORS error"
**Solution**: 
- Ensure backend is running on `http://localhost:8000`
- Verify frontend is running on `http://localhost:5173`
- Check CORS configuration in main.py

---

## Future Enhancements

Potential improvements:
1. **Caching**: Cache recommendations to reduce API calls
2. **Ratings**: Allow users to rate recommendations
3. **Filtering**: Filter recommendations by programming language, project size, etc.
4. **History**: Save recommendation history for users
5. **Refinement**: Allow users to refine recommendations based on feedback
6. **Combination**: Hybrid approach using both GitHub search and AI recommendations

---

## References

- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [Contributor Covenant](https://www.contributor-covenant.org/)
- [Open Source Best Practices](https://opensource.guide/)
