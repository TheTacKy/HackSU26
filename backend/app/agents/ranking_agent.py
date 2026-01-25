import openai
from app.config import OPENAI_API_KEY
import time
import json
import re


def rank_repos(repos, persona):
    """
    Rank repositories based on the full user profile using OpenAI API.
    Returns a list of repositories in ranked order.
    """
    if not repos or len(repos) == 0:
        return [], "No repositories to rank"
    
    if not OPENAI_API_KEY:
        return repos, "OPENAI_API_KEY not found"
    
    # Create OpenAI client
    client = openai.OpenAI(api_key=OPENAI_API_KEY)
    
    # Build concise persona description (to reduce token usage)
    user_interests = persona.get('interests', '') or 'Not specified'
    user_tech_stack = ', '.join(persona.get('stack', []))
    persona_desc = f"User: {persona.get('name', 'User')} | Occupation: {persona.get('occupation', 'N/A')} | Tech: {user_tech_stack} | Level: {persona.get('level', 'N/A')} | Interests: {user_interests} | Experience: {persona.get('experience', 'N/A')} | Goal: {persona.get('goal', 'N/A')}"
    
    # Build repository list with essential information only (to reduce token usage)
    repo_list = []
    for i, repo in enumerate(repos):
        # Safely handle description (can be None) - limit to 200 chars to save tokens
        description = repo.get('description') or 'No description'
        if description and len(description) > 200:
            description = description[:200] + "..."
        
        # Safely handle topics (can be None) - limit to top 5 topics to save tokens
        topics = repo.get('topics') or []
        topics_str = ', '.join(topics[:5]) if topics else 'None'
        
        # Get only essential metadata (removed forks, open_issues, dates to save tokens)
        stars = repo.get('stargazers_count', 0)
        language = repo.get('language', 'Unknown') or 'Unknown'
        
        # Compact format to minimize tokens
        repo_info = f"{i}. {repo.get('name', 'Unknown')} | Lang: {language} | Stars: {stars} | Desc: {description} | Topics: {topics_str}"
        repo_list.append(repo_info)
    
    repos_text = "\n".join(repo_list)
    num_repos = len(repos)
    
    # Ranking prompt - emphasizes user interests for ranking
    prompt = f"""Rank these {num_repos} GitHub repositories for a user who wants to contribute.

User profile: {persona_desc}

Repositories:
{repos_text}

Ranking criteria (in order of importance):
1. Interest match - How well does the repo description/topics match: {user_interests}
2. Tech stack match - Does it use: {user_tech_stack}
3. Skill level fit - Appropriate for {persona.get('level', 'N/A')} level

CRITICAL: You MUST return ONLY a comma-separated list of numbers from 0 to {num_repos-1} representing the ranked order (best match first).
Example for 5 repos: 2,0,4,1,3
Do NOT include any text, explanations, or other content. Only numbers separated by commas."""

    max_retries = 2
    retry_count = 0
    
    try:
        while retry_count <= max_retries:
            try:
                # Use OpenAI API
                response = client.chat.completions.create(
                    model='gpt-4o-mini',  # Using cost-effective model, can change to gpt-4o if needed
                    messages=[
                        {"role": "system", "content": "You are a ranking system. You MUST return ONLY a comma-separated list of numbers (0-indexed) representing repository indices in ranked order. Do NOT include any text, explanations, or other content. Example: 3,1,5,0,2,4"},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3
                )
                
                # Extract text from OpenAI response
                response_text = response.choices[0].message.content.strip()
                
                # Parse the response to get ranked indices
                try:
                    # Try to extract numbers from the response (handle cases where LLM adds text)
                    # First, try to find a line that looks like comma-separated numbers
                    lines = response_text.split('\n')
                    number_line = None
                    for line in lines:
                        # Check if line contains mostly numbers and commas
                        cleaned = line.replace(',', ' ').split()
                        if len(cleaned) > 0 and all(part.strip().isdigit() for part in cleaned):
                            number_line = line
                            break
                    
                    # If no clean line found, try to extract numbers from the whole response
                    if not number_line:
                        # Remove all non-digit, non-comma characters and try to parse
                        import re
                        number_line = re.sub(r'[^\d,]', '', response_text)
                    
                    # Parse the comma-separated numbers
                    ranked_indices = [int(x.strip()) for x in number_line.split(',') if x.strip().isdigit()]
                    
                    # Validate indices
                    valid_indices = [idx for idx in ranked_indices if 0 <= idx < len(repos)]
                    
                    # Add any missing indices at the end
                    all_indices = set(range(len(repos)))
                    missing_indices = sorted(list(all_indices - set(valid_indices)))
                    ranked_indices = valid_indices + missing_indices
                    
                    # Reorder repos based on ranking
                    ranked_repos = [repos[idx] for idx in ranked_indices if idx < len(repos)]
                    # Return repos with the OpenAI response for debugging
                    return ranked_repos, response_text
                except (ValueError, IndexError) as e:
                    # If parsing fails, return original order
                    print(f"[RANKING] Warning: Failed to parse ranking response: {e}")
                    print(f"[RANKING] Response was: {response_text[:500]}")
                    return repos, f"Error parsing response: {response_text[:200]}"
            except openai.AuthenticationError as e:
                # API key error
                print(f"Warning: OpenAI API key is invalid or expired. Please update OPENAI_API_KEY in .env file. Returning repos in original order.")
                return repos, f"OpenAI API key invalid or expired. Please update OPENAI_API_KEY in your .env file."
            except openai.RateLimitError as e:
                # Rate limit error - OpenAI provides retry_after in the error
                error_msg = str(e)
                retry_delay = None
                
                # Try to get retry_after from the error object
                if hasattr(e, 'retry_after'):
                    retry_delay = float(e.retry_after)
                else:
                    # Fallback: try to extract from error message
                    retry_match = re.search(r'retry after ([\d.]+)', error_msg, re.IGNORECASE)
                    if retry_match:
                        retry_delay = float(retry_match.group(1))
                
                # If we have retries left and a retry delay, wait and retry
                if retry_count < max_retries and retry_delay:
                    wait_time = retry_delay + 1  # Add 1 second buffer
                    print(f"Warning: OpenAI API rate limit exceeded. Retrying in {wait_time:.1f} seconds (attempt {retry_count + 1}/{max_retries + 1})...")
                    time.sleep(wait_time)
                    retry_count += 1
                    continue
                else:
                    # No more retries or no retry delay info
                    quota_info = """
OpenAI API Rate Limits:
- Rate limits vary by tier and model
- Free tier: Limited requests per minute
- Paid tier: Higher rate limits

Your rate limit has been exceeded. Options:
1. Wait and retry (automatic retry will attempt)
2. Upgrade to a paid tier for higher limits
3. Reduce request frequency or implement caching
4. Check usage at: https://platform.openai.com/usage
"""
                    print(f"Warning: OpenAI API rate limit exceeded. Returning repos in original order.")
                    return repos, f"OpenAI API rate limit exceeded.\n\n{quota_info}\n\nError details: {error_msg[:500]}"
            except openai.APIError as e:
                # General API error
                error_msg = str(e)
                print(f"Error in OpenAI API call: {e}")
                return repos, f"OpenAI API error: {error_msg[:500]}"
            except Exception as e:
                # Other errors
                error_msg = str(e)
                print(f"Error in ranking: {e}")
                return repos, f"Error: {error_msg[:500]}"
            
            # If we've exhausted retries, return original order
            if retry_count > max_retries:
                return repos, f"OpenAI API rate limit exceeded after {max_retries + 1} attempts. Returning repos in original order."
    finally:
        # OpenAI client doesn't need explicit closing, but we can clean up if needed
        pass