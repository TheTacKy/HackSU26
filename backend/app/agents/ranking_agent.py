from google import genai
from app.config import GEMINI_API_KEY


def rank_repos(repos, persona):
    """
    Rank repositories based on the full user profile using Gemini API.
    Returns a list of repositories in ranked order.
    """
    if not repos or len(repos) == 0:
        return []
    
    if not GEMINI_API_KEY:
        print("Warning: GEMINI_API_KEY not found. Returning repos in original order.")
        return repos
    
    # Create Gemini client
    client = genai.Client(api_key=GEMINI_API_KEY)
    
    # Build detailed persona description
    persona_desc = f"""
User Profile:
- Name: {persona.get('name', 'Not provided')}
- Occupation: {persona.get('occupation', 'Not provided')}
- Tech Stack: {', '.join(persona.get('stack', []))}
- Skill Level: {persona.get('level', 'Not specified')}
- Interests: {', '.join(persona.get('interests', []))}
- Open Source Experience: {persona.get('experience', 'Not specified')}
- Preferred Contribution Type: {persona.get('goal', 'Not specified')}
"""
    
    # Build repository list with key information
    repo_list = []
    for i, repo in enumerate(repos):
        repo_info = f"""
{i}. {repo.get('name', 'Unknown')}
   - Description: {repo.get('description', 'No description')[:200]}
   - Language: {repo.get('language', 'Unknown')}
   - Stars: {repo.get('stargazers_count', 0)}
   - Topics: {', '.join(repo.get('topics', [])[:5])}
   - URL: {repo.get('html_url', '')}
"""
        repo_list.append(repo_info)
    
    repos_text = "\n".join(repo_list)
    
    prompt = f"""{persona_desc}

Repositories to rank:
{repos_text}

Please rank these repositories from most to least suitable for this user. Consider:
1. How well the repository matches their tech stack
2. Alignment with their interests
3. Appropriateness for their skill level
4. Relevance to their preferred contribution type
5. Their open source experience level
6. Overall fit with their profile

Return ONLY a comma-separated list of numbers (0-indexed) representing the ranked order, from best match to worst match.
Example format: 3,1,5,0,2,4
Do not include any explanation or additional text, just the numbers."""

    try:
        # Use Gemini model with the new API
        response = client.models.generate_content(
            model='gemini-2.0-flash-exp',
            contents=prompt,
            config={'temperature': 0.3}
        )
        
        # Extract text from response (structure may vary)
        if hasattr(response, 'text'):
            response_text = response.text.strip()
        elif hasattr(response, 'candidates') and len(response.candidates) > 0:
            response_text = response.candidates[0].content.parts[0].text.strip()
        else:
            response_text = str(response).strip()
        
        # Parse the response to get ranked indices
        try:
            ranked_indices = [int(x.strip()) for x in response_text.split(',')]
            # Validate indices
            valid_indices = [idx for idx in ranked_indices if 0 <= idx < len(repos)]
            # Add any missing indices at the end
            all_indices = set(range(len(repos)))
            missing_indices = sorted(list(all_indices - set(valid_indices)))
            ranked_indices = valid_indices + missing_indices
            
            # Reorder repos based on ranking
            ranked_repos = [repos[idx] for idx in ranked_indices if idx < len(repos)]
            return ranked_repos
        except (ValueError, IndexError):
            # If parsing fails, return original order
            print(f"Warning: Failed to parse ranking response: {response_text}")
            return repos
    except Exception as e:
        print(f"Error in ranking: {e}")
        # Return original order if ranking fails
        return repos
    finally:
        # Close the client to release resources
        try:
            client.close()
        except:
            pass