import openai
import json
from app.config import OPENAI_API_KEY

openai.api_key = OPENAI_API_KEY


def generate_recommendations(repos, issues_map):
    """Generate recommendations based on repos found."""
    recommendations = []

    for repo in repos:
        repo_key = repo["full_name"]
        issues = issues_map.get(repo_key, [])
        
        # Extract relevant issue information
        issues_list = []
        for issue in issues[:5]:  # Limit to 5 issues
            if isinstance(issue, dict):
                issues_list.append({
                    "title": issue.get("title", "No title"),
                    "url": issue.get("html_url", ""),
                    "number": issue.get("number", 0),
                    "state": issue.get("state", "open")
                })
        
        recommendations.append({
            "name": repo["name"],
            "full_name": repo.get("full_name", ""),
            "url": repo["html_url"],
            "stars": repo["stargazers_count"],
            "description": repo.get("description", "No description available"),
            "language": repo.get("language", "Unknown"),
            "topics": repo.get("topics", []),
            "issues": issues_list,
            "issues_count": len(issues_list)
        })

    return recommendations


def get_personalized_recommendations(interests: str, skills: str, experience_level: str):
    """
    Generate personalized repository recommendations based on user interests using ChatGPT.
    
    Args:
        interests: Comma-separated list of user interests/technologies
        skills: Comma-separated list of user skills
        experience_level: User's experience level (beginner, intermediate, advanced)
    
    Returns:
        List of recommended repositories with descriptions
    """
    
    prompt = f"""You are an expert in helping new developers find the perfect open source projects to contribute to.

Based on the following user profile, recommend 5-7 GitHub repositories that would be perfect for them to contribute to. 

User Profile:
- Interests: {interests}
- Skills: {skills}
- Experience Level: {experience_level}

For each repository recommendation, provide:
1. Repository name (owner/repo format)
2. Brief description (1-2 sentences)
3. Why it's a good fit for this user
4. Suggested first contribution type (documentation, bug fix, feature, etc.)
5. Difficulty level (Beginner, Intermediate, Advanced)

Format your response as a JSON array with objects containing these fields: name, description, fit, firstContribution, difficulty.

Make sure the recommendations are actual popular open source projects that exist on GitHub."""

    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {
                "role": "system",
                "content": "You are a helpful assistant that recommends open source projects for developers. Always respond with valid JSON."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.7,
    )

    response_text = response.choices[0].message.content
    
    # Try to parse JSON from response
    try:
        # Find JSON array in response
        start_idx = response_text.find('[')
        end_idx = response_text.rfind(']') + 1
        if start_idx != -1 and end_idx > start_idx:
            json_str = response_text[start_idx:end_idx]
            recommendations = json.loads(json_str)
            return recommendations
    except (json.JSONDecodeError, ValueError):
        pass
    
    # Fallback if JSON parsing fails
    return {
        "recommendations": response_text,
        "message": "Could not parse structured recommendations. Here's ChatGPT's response:"
    }