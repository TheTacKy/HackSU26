import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Cookies from 'js-cookie'
import RepositoryList from '../components/RepositoryList'
import Pagination from '../components/Pagination'
import LanguageAutocomplete from '../components/LanguageAutocomplete'

function Search() {
  const searchStartedAt = useRef(null)
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
      tech_stack: [],
      interests: '',  // Changed from array to string for prompt-based input
      skill_level: '',
      open_source_experience: ''
    };
  };

  const [formData, setFormData] = useState(getInitialFormData())

  const [loading, setLoading] = useState(false)
  const [loadingStatus, setLoadingStatus] = useState('Finding repositories…')
  const [error, setError] = useState(null)
  const [results, setResults] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [loadingIssues, setLoadingIssues] = useState(false)
  const [pendingIssueRepos, setPendingIssueRepos] = useState({})
  const [shouldScrollToResults, setShouldScrollToResults] = useState(false)
  // Cache all recommendations to avoid re-fetching on page changes
  const [cachedAllRecommendations, setCachedAllRecommendations] = useState(null)
  const [cachedPagination, setCachedPagination] = useState(null)

  useEffect(() => {
    Cookies.set('formData', JSON.stringify(formData), { expires: 7 });
  }, [formData]);

  useEffect(() => {
    if (!loading || results) {
      return
    }

    setLoadingStatus('Finding repositories…')
    const rankingTimer = setTimeout(
      () => setLoadingStatus('Ranking repositories…'),
      1500
    )
    const preparingTimer = setTimeout(
      () => setLoadingStatus('Preparing recommendations…'),
      4000
    )

    return () => {
      clearTimeout(rankingTimer)
      clearTimeout(preparingTimer)
    }
  }, [loading, results])

  useEffect(() => {
    if (!shouldScrollToResults || (!loading && !results)) {
      return
    }

    requestAnimationFrame(() => {
      const resultsSection = document.getElementById('recommended-repositories')
      if (resultsSection) {
        const elementPosition = resultsSection.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.pageYOffset - 100
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        })
        setShouldScrollToResults(false)
      }
    })
  }, [shouldScrollToResults, loading, results]);

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleTechStackChange = (techStack) => {
    setFormData(prev => ({
      ...prev,
      tech_stack: techStack
    }))
  }

  const mergeIssuesIntoRecommendations = (recommendations, issuesByRepo) => (
    recommendations.map((repo) => {
      const issues = issuesByRepo[repo.full_name]
      if (!issues) {
        return repo
      }

      return {
        ...repo,
        issues,
        issues_count: issues.length,
        issuesLoaded: true,
      }
    })
  )

  const fetchIssuesForRepos = async (repositoriesForIssues, sourceRecommendations = null) => {
    const missingRepos = repositoriesForIssues.filter(
      (repo) => repo?.full_name && !repo.issuesLoaded
    )

    if (missingRepos.length === 0) {
      return
    }

    const pendingMap = Object.fromEntries(
      missingRepos.map((repo) => [repo.full_name, true])
    )

    setLoadingIssues(true)
    setPendingIssueRepos((prev) => ({ ...prev, ...pendingMap }))
    const issuesStartedAt = performance.now()

    try {
      const response = await fetch('http://localhost:8000/issues/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repositories: missingRepos.map((repo) => repo.full_name),
          experience: formData.open_source_experience,
        }),
      })

      const data = response.ok ? await response.json() : null
      console.log(`[FRONTEND] issues_response total_time=${((performance.now() - issuesStartedAt) / 1000).toFixed(4)}s`)
      const issuesByRepo = data?.issues ?? {}

      setCachedAllRecommendations((prev) => {
        const base = sourceRecommendations ?? prev ?? []
        const next = mergeIssuesIntoRecommendations(base, issuesByRepo)

        if (sourceRecommendations) {
          const reposPerPage = 12
          const startIdx = (currentPage - 1) * reposPerPage
          const endIdx = startIdx + reposPerPage
          setResults(next.slice(startIdx, endIdx))
        }

        return next
      })

      setResults((prev) => mergeIssuesIntoRecommendations(prev ?? [], issuesByRepo))
    } catch (issuesError) {
      console.error('Error fetching issues:', issuesError)
    } finally {
      setPendingIssueRepos((prev) => {
        const next = { ...prev }
        missingRepos.forEach((repo) => {
          delete next[repo.full_name]
        })
        return next
      })
      setLoadingIssues(false)
    }
  }

  const fetchRepos = async (page = 1, useCache = false, searchFormData = formData) => {
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
      await fetchIssuesForRepos(paginatedResults)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const requestStartedAt = performance.now()
      const page1Response = await fetch(`http://localhost:8000/match?page=1&include_issues=false`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchFormData),
      })
      console.log(`[FRONTEND] match_headers total_time=${((performance.now() - requestStartedAt) / 1000).toFixed(4)}s`)
      const jsonStartedAt = performance.now()
      const page1Data = page1Response.ok ? await page1Response.json() : null
      console.log(`[FRONTEND] match_json_parse total_time=${((performance.now() - jsonStartedAt) / 1000).toFixed(4)}s`)
      
      if (!page1Data || !page1Data.recommendations) {
        throw new Error('Failed to fetch repositories. Please try again.')
      }
      
      const allRecommendations = Array.isArray(page1Data.recommendations)
        ? page1Data.recommendations.map((repo) => ({
            ...repo,
            issues: Array.isArray(repo.issues) ? repo.issues : [],
            issues_count: repo.issues_count ?? 0,
            issuesLoaded: false,
          }))
        : []

      // Cache all recommendations
      setCachedAllRecommendations(allRecommendations)
      
      // Use page 1 pagination info as base, but update with actual total
      if (page1Data.pagination) {
        const totalRepos = allRecommendations.length
        const totalPages = Math.max(1, Math.ceil(totalRepos / 12))
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

      // Paginate the cached results for the requested page
      const reposPerPage = 12
      const startIdx = (page - 1) * reposPerPage
      const endIdx = startIdx + reposPerPage
      const paginatedResults = allRecommendations.slice(startIdx, endIdx)

      setResults(paginatedResults)
      setCurrentPage(page)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (searchStartedAt.current !== null) {
            console.log(`[FRONTEND] repositories_visible total_time=${((performance.now() - searchStartedAt.current) / 1000).toFixed(4)}s`)
          }
        })
      })

      if (paginatedResults.length === 0) {
        if (allRecommendations.length === 0) {
          setError('No repositories found matching your criteria. Please try adjusting your search.')
        } else {
          setError(`No repositories found for page ${page}. Total available: ${allRecommendations.length}`)
        }
      } else {
        setError(null)
      }

      console.log(`[FRONTEND] repositories_processed count=${allRecommendations.length} page=${page}`)
      await fetchIssuesForRepos(paginatedResults, allRecommendations)
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
      setError('Please add at least one coding language.')
      return
    }
    
    if (!formData.interests.trim()) {
      setError('Please describe your interests.')
      return
    }

    searchStartedAt.current = performance.now()
    console.log('[FRONTEND] search_started')
    
    // Clear cache on new search
    setCachedAllRecommendations(null)
    setCachedPagination(null)
    setPendingIssueRepos({})
    setResults(null)
    setPagination(null)
    setCurrentPage(1)  // Reset to page 1 on new search
    setShouldScrollToResults(true)
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
              Repo Scout
            </Link>
          </div>
        </div>
      </nav>

      {/* Form Section */}
      <div className="container mx-auto px-4 pt-6 pb-12 max-w-7xl">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Find Your Perfect Repository
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="bg-zinc-800/60 backdrop-blur-sm border border-zinc-700 rounded-xl p-8 space-y-6">
            {/* Coding Languages */}
            <LanguageAutocomplete
              value={formData.tech_stack}
              onChange={handleTechStackChange}
            />

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
                placeholder="Describe your interests"
                required
              />
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

        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-3xl mx-auto mt-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {/* Results Board */}
        {(loading || results) && (
          <div className="mt-12">
            <RepositoryList
              repositories={results}
              pagination={pagination}
              loading={loading && !results}
              loadingStatus={loadingStatus}
              loadingIssues={loadingIssues}
              pendingIssueRepos={pendingIssueRepos}
            />
            <Pagination
              pagination={pagination}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              loading={loading}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default Search
