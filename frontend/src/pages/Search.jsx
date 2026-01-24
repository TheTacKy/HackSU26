import { useState } from 'react'
import { Link } from 'react-router-dom'

function Search() {
  const [formData, setFormData] = useState({
    name: '',
    tech_stack: [],
    skill_level: '',
    interests: [],
    open_source_experience: '',
    occupation: '',
    contribution_type: ''
  })

  const [currentTechStack, setCurrentTechStack] = useState('')
  const [currentInterest, setCurrentInterest] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [results, setResults] = useState(null)

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

  const addInterest = () => {
    if (currentInterest.trim() && !formData.interests.includes(currentInterest.trim())) {
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, currentInterest.trim()]
      }))
      setCurrentInterest('')
    }
  }

  const removeInterest = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const response = await fetch('http://localhost:8000/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setResults(data)
      console.log('Match results:', data)
    } catch (err) {
      setError(err.message || 'Failed to fetch matches. Please try again.')
      console.error('Error submitting form:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      {/* Navigation Bar */}
      <nav className="bg-zinc-900/90 backdrop-blur-sm border-b border-zinc-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-white hover:text-emerald-400 transition-colors">
              HackSU26
            </Link>
            <Link
              to="/"
              className="px-4 py-2 text-zinc-300 hover:text-white transition-colors"
            >
              Home
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
                className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                  className="flex-1 px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="e.g., React, Python, Node.js"
                />
                <button
                  type="button"
                  onClick={addTechStack}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tech_stack.map((tech, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-emerald-600 text-white rounded-full text-sm"
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
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select your skill level</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
            </div>

            {/* Interests */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Interests
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={currentInterest}
                  onChange={(e) => setCurrentInterest(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
                  className="flex-1 px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="e.g., Machine Learning, Web Development, Mobile Apps"
                />
                <button
                  type="button"
                  onClick={addInterest}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-emerald-600 text-white rounded-full text-sm"
                  >
                    {interest}
                    <button
                      type="button"
                      onClick={() => removeInterest(interest)}
                      className="ml-2 hover:text-red-300"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
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
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select your experience</option>
                <option value="none">None - First time contributor</option>
                <option value="some">Some - A few contributions</option>
                <option value="experienced">Experienced - Regular contributor</option>
                <option value="maintainer">Maintainer - Project maintainer</option>
              </select>
            </div>

            {/* Occupation */}
            <div>
              <label htmlFor="occupation" className="block text-white font-semibold mb-2">
                Occupation
              </label>
              <input
                type="text"
                id="occupation"
                name="occupation"
                value={formData.occupation}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="e.g., Student, Software Engineer, Data Scientist"
                required
              />
            </div>

            {/* Contribution Type */}
            <div>
              <label htmlFor="contribution_type" className="block text-white font-semibold mb-2">
                Preferred Contribution Type
              </label>
              <select
                id="contribution_type"
                name="contribution_type"
                value={formData.contribution_type}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select contribution type</option>
                <option value="code">Code contributions</option>
                <option value="documentation">Documentation</option>
                <option value="testing">Testing & QA</option>
                <option value="design">Design & UI/UX</option>
                <option value="any">Any type</option>
              </select>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-lg transition-all duration-200 shadow-lg hover:shadow-emerald-500/50 transform hover:scale-[1.02] disabled:transform-none"
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

          {/* Results */}
          {results && (
            <div className="mt-6 bg-zinc-800/60 backdrop-blur-sm border border-zinc-700 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">Match Results</h2>
              <pre className="bg-zinc-900 p-4 rounded-lg overflow-auto text-zinc-300 text-sm">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Search
