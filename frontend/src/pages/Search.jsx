import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Cookies from 'js-cookie'

function Search() {
  const getInitialFormData = () => {
    const saved = Cookies.get('formData');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing saved form data:', e);
      }
    }
    return {
      name: '',
      tech_stack: [],
      interests: '',  // Changed from array to string for prompt-based input
      skill_level: '',
      open_source_experience: ''
    };
  };

  const [formData, setFormData] = useState(getInitialFormData())

  const [currentTechStack, setCurrentTechStack] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [results, setResults] = useState(null)
  const [geminiResponse, setGeminiResponse] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  // Cache all recommendations to avoid re-fetching on page changes
  const [cachedAllRecommendations, setCachedAllRecommendations] = useState(null)
  const [cachedPagination, setCachedPagination] = useState(null)

  useEffect(() => {
    Cookies.set('formData', JSON.stringify(formData), { expires: 7 });
  }, [formData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const addTechStack = () => {
    if (currentTechStack.trim() && !formData.tech_stack.includes(currentTechStack.trim())) {
      setFormData(prev => ({
        ...prev,
        tech_stack: [...prev.tech_stack, currentTechStack.trim()]
      }))
      setCurrentTechStack('')
    }
  }

  const removeTechStack = (tech) => {
    setFormData(prev => ({
      ...prev,
      tech_stack: prev.tech_stack.filter(t => t !== tech)
    }))
  }

  const fetchRepos = async (page = 1, useCache = false) => {
    // If we have cached data and we're just changing pages, use cache
    if (useCache && cachedAllRecommendations && cachedAllRecommendations.length > 0) {
      const reposPerPage = 12
      const startIdx = (page - 1) * reposPerPage
      const endIdx = startIdx + reposPerPage
      const paginatedResults = cachedAllRecommendations.slice(startIdx, endIdx)
      
      setResults(paginatedResults)
      setCurrentPage(page)
      if (cachedPagination) {
        setPagination({
          ...cachedPagination,
          current_page: page
        })
      }
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Fetch pages sequentially to avoid GitHub API rate limits
      // Start with page 1, then fetch 2 and 3 if needed
      console.log('Fetching page 1...')
      const page1Response = await fetch(`http://localhost:8000/match?page=1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const page1Data = page1Response.ok ? await page1Response.json() : null
      
      if (!page1Data || !page1Data.recommendations) {
        throw new Error('Failed to fetch repositories. Please try again.')
      }
      
      // Only fetch pages 2 and 3 if page 1 was successful and we have pagination info
      let page2Data = null
      let page3Data = null
      
      if (page1Data.pagination && page1Data.pagination.total_pages > 1) {
        console.log('Fetching page 2...')
        const page2Response = await fetch(`http://localhost:8000/match?page=2`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        page2Data = page2Response.ok ? await page2Response.json() : null
        
        if (page1Data.pagination.total_pages > 2) {
          console.log('Fetching page 3...')
          const page3Response = await fetch(`http://localhost:8000/match?page=3`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
          })
          page3Data = page3Response.ok ? await page3Response.json() : null
        }
      }

      if (!page1Data || !page1Data.recommendations) {
        throw new Error('Failed to fetch repositories. Please try again.')
      }

      // Combine all recommendations from all pages
      const allRecommendations = []
      if (page1Data.recommendations && Array.isArray(page1Data.recommendations)) {
        allRecommendations.push(...page1Data.recommendations)
      }
      if (page2Data?.recommendations && Array.isArray(page2Data.recommendations)) {
        allRecommendations.push(...page2Data.recommendations)
      }
      if (page3Data?.recommendations && Array.isArray(page3Data.recommendations)) {
        allRecommendations.push(...page3Data.recommendations)
      }

      // Cache all recommendations
      setCachedAllRecommendations(allRecommendations)
      
      // Use page 1 pagination info as base, but update with actual total
      if (page1Data.pagination) {
        const totalRepos = allRecommendations.length
        const totalPages = Math.min(3, Math.ceil(totalRepos / 12))
        const paginationInfo = {
          ...page1Data.pagination,
          total_repos: totalRepos,
          total_pages: totalPages
        }
        setCachedPagination(paginationInfo)
        setPagination({
          ...paginationInfo,
          current_page: page
        })
      }

      // Set gemini response from page 1
      setGeminiResponse(page1Data.gemini_response || null)

      // Paginate the cached results for the requested page
      const reposPerPage = 12
      const startIdx = (page - 1) * reposPerPage
      const endIdx = startIdx + reposPerPage
      const paginatedResults = allRecommendations.slice(startIdx, endIdx)

      setResults(paginatedResults)
      setCurrentPage(page)

      if (paginatedResults.length === 0) {
        if (allRecommendations.length === 0) {
          setError('No repositories found matching your criteria. Please try adjusting your search.')
        } else {
          setError(`No repositories found for page ${page}. Total available: ${allRecommendations.length}`)
        }
      } else {
        setError(null)
      }

      console.log(`Fetched and cached ${allRecommendations.length} total recommendations, showing page ${page}`)
    } catch (err) {
      setError(err.message || 'Failed to fetch matches. Please try again.')
      console.error('Error submitting form:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate that tech_stack and interests are not empty
    if (formData.tech_stack.length === 0) {
      setError('Please add at least one technology to your tech stack.')
      return
    }
    
    if (!formData.interests.trim()) {
      setError('Please describe your interests.')
      return
    }
    
    // Clear cache on new search
    setCachedAllRecommendations(null)
    setCachedPagination(null)
    setCurrentPage(1)  // Reset to page 1 on new search
    await fetchRepos(1, false)  // Don't use cache, fetch fresh data
  }

  const handlePageChange = async (page) => {
    if (page < 1 || (pagination && page > pagination.total_pages)) {
      return
    }
    // Use cached data if available, otherwise fetch
    await fetchRepos(page, true)  // Use cache if available
    
    // Scroll to "Recommended Repositories" section after data loads
    // Account for sticky navbar height (approximately 80px)
    setTimeout(() => {
      const resultsSection = document.getElementById('recommended-repositories')
      if (resultsSection) {
        const elementPosition = resultsSection.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.pageYOffset - 100  // 100px offset for navbar
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        })
      }
    }, 100)  // Small delay to ensure DOM is updated
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      {/* Navigation Bar */}
      <nav className="bg-zinc-900/90 backdrop-blur-sm border-b border-zinc-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-white hover:text-sky-400 transition-colors">
              HackSU26
            </Link>
          </div>
        </div>
      </nav>

      {/* Form Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Find Your Perfect Repository
            </h1>
            <p className="text-zinc-400 text-lg">
              Tell us about yourself and we&apos;ll match you with the best open source projects
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-zinc-800/60 backdrop-blur-sm border border-zinc-700 rounded-xl p-8 space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-white font-semibold mb-2">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder="Enter your name"
                required
              />
            </div>

            {/* Tech Stack */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Tech Stack
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={currentTechStack}
                  onChange={(e) => setCurrentTechStack(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechStack())}
                  className="flex-1 px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  placeholder="e.g., React, Python, Node.js"
                />
                <button
                  type="button"
                  onClick={addTechStack}
                  className="px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tech_stack.map((tech, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-sky-600 text-white rounded-full text-sm"
                  >
                    {tech}
                    <button
                      type="button"
                      onClick={() => removeTechStack(tech)}
                      className="ml-2 hover:text-red-300"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Interests */}
            <div>
              <label htmlFor="interests" className="block text-white font-semibold mb-2">
                Interests & Goals
              </label>
              <textarea
                id="interests"
                name="interests"
                value={formData.interests}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-y"
                placeholder="Describe your interests, what kind of projects you're looking for, and what you'd like to work on. For example: 'I'm interested in machine learning projects, especially those related to natural language processing. I want to contribute to open source projects that help developers build better tools.'"
                required
              />
              <p className="text-zinc-400 text-sm mt-2">
                Tell us about the types of projects you're interested in and what you hope to contribute to.
              </p>
            </div>

            {/* Skill Level */}
            <div>
              <label htmlFor="skill_level" className="block text-white font-semibold mb-2">
                Skill Level
              </label>
              <select
                id="skill_level"
                name="skill_level"
                value={formData.skill_level}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                required
              >
                <option value="">Select your skill level</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
            </div>

            {/* Open Source Experience */}
            <div>
              <label htmlFor="open_source_experience" className="block text-white font-semibold mb-2">
                Open Source Experience
              </label>
              <select
                id="open_source_experience"
                name="open_source_experience"
                value={formData.open_source_experience}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                required
              >
                <option value="">Select your experience</option>
                <option value="none">None - First time contributor</option>
                <option value="some">Some - A few contributions</option>
                <option value="experienced">Experienced - Regular contributor</option>
                <option value="maintainer">Maintainer - Project maintainer</option>
              </select>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-lg transition-all duration-200 shadow-lg transform hover:scale-[1.02] disabled:transform-none"
              >
                {loading ? 'Searching...' : 'Find Repositories'}
              </button>
            </div>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
              <p className="font-semibold">Error:</p>
              <p>{error}</p>
            </div>
          )}

          {/* Results Board */}
          {results && Array.isArray(results) && results.length > 0 && (
            <div id="recommended-repositories" className="mt-8 scroll-mt-24">
              <h2 className="text-3xl font-bold text-white mb-6 text-center">
                Recommended Repositories
              </h2>
              {pagination && (
                <div className="text-center text-zinc-400 mb-4">
                  Page {pagination.current_page} of {pagination.total_pages} ({pagination.total_repos} repositories found)
                </div>
              )}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((repo, index) => (
                  <div
                    key={index}
                    className="bg-zinc-800/60 backdrop-blur-sm border border-zinc-700 rounded-xl p-6 hover:border-sky-500/50 transition-all duration-200 flex flex-col"
                  >
                    {/* Repository Header */}
                    <div className="mb-4">
                      <div className="flex items-start justify-between mb-2">
                        <a
                          href={repo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xl font-bold text-sky-400 hover:text-sky-300 transition-colors line-clamp-1"
                        >
                          {repo.name}
                        </a>
                        <div className="flex items-center gap-1 text-yellow-400 ml-2 flex-shrink-0">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-sm font-semibold">{repo.stars}</span>
                        </div>
                      </div>
                      
                      {/* Language Badge */}
                      {repo.language && (
                        <div className="inline-flex items-center px-2 py-1 bg-sky-600/20 text-sky-300 rounded-md text-xs font-medium mb-2">
                          {repo.language}
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-zinc-300 text-sm mb-4 line-clamp-3 flex-grow">
                      {repo.description || "No description available"}
                    </p>

                    {/* Topics */}
                    {repo.topics && repo.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {repo.topics.slice(0, 3).map((topic, topicIndex) => (
                          <span
                            key={topicIndex}
                            className="px-2 py-1 bg-zinc-700 text-zinc-300 rounded text-xs"
                          >
                            {topic}
                          </span>
                        ))}
                        {repo.topics.length > 3 && (
                          <span className="px-2 py-1 bg-zinc-700 text-zinc-300 rounded text-xs">
                            +{repo.topics.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Issues Section */}
                    {repo.issues && repo.issues.length > 0 && (
                      <div className="mt-auto pt-4 border-t border-zinc-700">
                        <h4 className="text-sm font-semibold text-white mb-2">
                          Good First Issues ({repo.issues_count})
                        </h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto bg-zinc-900/50 rounded-lg p-2 scrollbar-hide">
                          {repo.issues.map((issue, issueIndex) => (
                            <a
                              key={issueIndex}
                              href={issue.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-xs text-sky-400 hover:text-sky-300 transition-colors line-clamp-1 hover:underline"
                            >
                              #{issue.number} {issue.title}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* View Repository Button */}
                    <a
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 w-full px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg text-sm text-center transition-colors"
                    >
                      View Repository
                    </a>
                  </div>
                ))}
              </div>
              
              {/* Pagination Controls */}
              {pagination && pagination.total_pages > 1 && (
                <div className="mt-8 flex justify-center items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
                  >
                    Previous
                  </button>
                  
                  {[1, 2, 3].filter(page => page <= pagination.total_pages).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      disabled={loading}
                      className={`px-4 py-2 min-w-[3rem] font-semibold rounded-lg transition-colors ${
                        currentPage === pageNum
                          ? 'bg-sky-600 text-white'
                          : 'bg-zinc-700 hover:bg-zinc-600 text-white disabled:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === pagination.total_pages || loading}
                    className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Empty Results */}
          {results && Array.isArray(results) && results.length === 0 && (
            <div className="mt-6 p-8 bg-zinc-800/60 backdrop-blur-sm border border-zinc-700 rounded-xl text-center">
              <p className="text-zinc-400 text-lg">No repositories found. Try adjusting your search criteria.</p>
            </div>
          )}

          {/* AI Response (for testing) */}
          {geminiResponse && (
            <div className="mt-8 bg-zinc-800/60 backdrop-blur-sm border border-zinc-700 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">OpenAI Ranking Output (Debug)</h3>
              <div className="bg-zinc-900 p-4 rounded-lg">
                <pre className="text-zinc-300 text-sm whitespace-pre-wrap break-words">
                  {geminiResponse}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Search
