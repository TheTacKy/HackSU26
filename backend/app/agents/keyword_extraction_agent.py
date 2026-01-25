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
    
    prompt = f"""Extract 5-10 specific keywords and related terms from this user's interests description that would be useful for searching GitHub repositories.

User's interests: "{interests_prompt}"

Extract:
1. Main keywords (e.g., "rpg", "video games" from "I'm looking to contribute to some open source rpg video games")
2. Related/synonym terms (e.g., "game development" for "video games", "gaming" for "video games")
3. Domain-specific terms that would help find relevant repositories

Return ONLY a comma-separated list of keywords (no explanations, no numbers, just keywords).
Example format: rpg, video games, game development, gaming, open source games, game engine
Keep keywords concise (1-3 words max per keyword)."""

    try:
        response = client.chat.completions.create(
            model='gpt-4o-mini',
            messages=[
                {"role": "system", "content": "You are a helpful assistant that extracts search keywords from user descriptions. Return only comma-separated keywords."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=100
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
        
        # Limit to 10 keywords max
        keywords = cleaned_keywords[:10]
        
        if not keywords:
            print("[KEYWORD_EXTRACTION] No keywords extracted, using fallback")
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
    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'i', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'me', 'you', 'him', 'her', 'us', 'them', 'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'some', 'looking', 'contribute', 'open', 'source', 'help', 'coding', 'features', 'might', 'need'}
    
    # Extract words (alphanumeric, at least 3 chars) and filter out stop words
    words = re.findall(r'\b\w{3,}\b', interests_prompt.lower())
    keywords = [word for word in words if word not in stop_words][:10]
    
    if not keywords:
        print("[KEYWORD_EXTRACTION] Fallback returned no keywords, using default: ['open source']")
        return ["open source"]
    
    print(f"[KEYWORD_EXTRACTION] Fallback extracted {len(keywords)} keywords: {keywords}")
    return keywords
