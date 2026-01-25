import openai
from app.config import OPENAI_API_KEY
import re


def extract_keywords(interests_prompt):
    """
    Extract and expand keywords from user interests prompt using OpenAI.
    Returns a list of keywords that can be used for GitHub repository searches.
    """
    print(f"\n[KEYWORD_EXTRACTION] Starting keyword extraction")
    print(f"[KEYWORD_EXTRACTION] Input prompt: {interests_prompt[:200]}...")
    
    if not interests_prompt or not interests_prompt.strip():
        print("[KEYWORD_EXTRACTION] Empty prompt, returning default: ['open source']")
        return ["open source"]
    
    if not OPENAI_API_KEY:
        print("[KEYWORD_EXTRACTION] Warning: OPENAI_API_KEY not found. Using fallback keyword extraction.")
        return _fallback_keyword_extraction(interests_prompt)
    
    # Create OpenAI client
    client = openai.OpenAI(api_key=OPENAI_API_KEY)
    
    prompt = f"""Extract up to 5 specific, concrete keywords from this user's interests description that would be useful for searching GitHub repositories.

User's interests: "{interests_prompt}"

IMPORTANT RULES:
- Extract ONLY the most specific, concrete terms directly mentioned by the user
- DO NOT include generic terms like: "open source", "contribution", "community", "github", "repositories", "projects"
- DO NOT add synonyms or related terms unless they are explicitly mentioned
- Focus on domain-specific terms (e.g., "pokemon", "pokemon go", "video games", "rpg")
- Maximum 5 keywords total

Return ONLY a comma-separated list of keywords (no explanations, no numbers, just keywords).
Example: pokemon, pokemon go, video games
Keep keywords concise (1-3 words max per keyword)."""

    try:
        response = client.chat.completions.create(
            model='gpt-4o-mini',
                    messages=[
                        {"role": "system", "content": "You are a keyword extractor. Extract ONLY the most specific, concrete terms directly from the user's input. Exclude generic terms like 'open source', 'contribution', 'community'. Return only comma-separated keywords, maximum 5."},
                        {"role": "user", "content": prompt}
                    ],
            temperature=0.2,  # Lower temperature for more focused extraction
            max_tokens=50  # Reduced since we only need 5 keywords
        )
        
        response_text = response.choices[0].message.content.strip()
        
        # Parse the comma-separated keywords
        keywords = [kw.strip() for kw in response_text.split(',') if kw.strip()]
        
        # Clean and validate keywords (remove quotes, limit length)
        cleaned_keywords = []
        for kw in keywords:
            # Remove quotes if present
            kw = kw.strip('"\'')
            # Limit to 3 words max
            if len(kw.split()) <= 3 and len(kw) > 2:
                cleaned_keywords.append(kw.lower())
        
        # Filter out generic terms that don't add search value
        generic_terms = {'open source', 'open-source', 'contribution', 'contributions', 'community', 
                        'github', 'repositories', 'repos', 'repository', 'projects', 'project',
                        'software', 'development', 'code', 'coding', 'programming', 'developer',
                        'help', 'looking', 'want', 'interested', 'contribute', 'contributing'}
        
        filtered_keywords = []
        for kw in cleaned_keywords:
            # Skip if it's a generic term
            if kw.lower() not in generic_terms:
                filtered_keywords.append(kw)
        
        # Limit to 5 keywords max
        keywords = filtered_keywords[:5]
        
        if not keywords:
            print("[KEYWORD_EXTRACTION] No keywords extracted after filtering, using fallback")
            return _fallback_keyword_extraction(interests_prompt)
        
        print(f"[KEYWORD_EXTRACTION] Successfully extracted {len(keywords)} keywords: {keywords}")
        return keywords
        
    except Exception as e:
        print(f"[KEYWORD_EXTRACTION] Error in keyword extraction: {e}. Using fallback method.")
        return _fallback_keyword_extraction(interests_prompt)


def _fallback_keyword_extraction(interests_prompt):
    """
    Fallback keyword extraction using simple regex when OpenAI is unavailable.
    """
    print("[KEYWORD_EXTRACTION] Using fallback regex extraction")
    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'i', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'me', 'you', 'him', 'her', 'us', 'them', 'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'some', 'looking', 'contribute', 'open', 'source', 'help', 'coding', 'features', 'might', 'need', 'interested', 'want', 'related', 'repositories', 'repos', 'github', 'projects', 'project', 'community', 'contribution', 'contributions'}
    
    # Extract words (alphanumeric, at least 3 chars) and filter out stop words
    words = re.findall(r'\b\w{3,}\b', interests_prompt.lower())
    keywords = [word for word in words if word not in stop_words]
    
    # Limit to 5 keywords max
    keywords = keywords[:5]
    
    if not keywords:
        print("[KEYWORD_EXTRACTION] Fallback returned no keywords, using default: ['open source']")
        return ["open source"]
    
    print(f"[KEYWORD_EXTRACTION] Fallback extracted {len(keywords)} keywords: {keywords}")
    return keywords
