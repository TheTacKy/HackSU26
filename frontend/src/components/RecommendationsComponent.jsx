import { useState } from 'react'

function RecommendationsComponent() {
  const [recommendations, setRecommendations] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    interests: '',
    skills: '',
    experience_level: 'intermediate'
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleGetRecommendations = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('http://localhost:8000/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interests: formData.interests,
          skills: formData.skills,
          experience_level: formData.experience_level
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get recommendations')
      }

      const data = await response.json()
      setRecommendations(data.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Recommendations Form */}
      <div className="bg-zinc-800/60 backdrop-blur-sm border border-zinc-700 rounded-xl p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Get AI-Powered Recommendations</h2>
        <p className="text-zinc-400 mb-6">
          Let ChatGPT find the perfect open source projects for you based on your interests and skills.
        </p>

        <form onSubmit={handleGetRecommendations} className="space-y-6">
          {/* Interests */}
          <div>
            <label htmlFor="interests" className="block text-white font-semibold mb-2">
              Your Interests / Technologies *
            </label>
            <input
              type="text"
              id="interests"
              name="interests"
              value={formData.interests}
              onChange={handleInputChange}
              placeholder="e.g., Web Development, Machine Learning, Mobile Apps, DevOps"
              required
              className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          {/* Skills */}
          <div>
            <label htmlFor="skills" className="block text-white font-semibold mb-2">
              Your Skills / Languages *
            </label>
            <input
              type="text"
              id="skills"
              name="skills"
              value={formData.skills}
              onChange={handleInputChange}
              placeholder="e.g., Python, JavaScript, React, Docker, SQL"
              required
              className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          {/* Experience Level */}
          <div>
            <label htmlFor="experience_level" className="block text-white font-semibold mb-2">
              Experience Level *
            </label>
            <select
              id="experience_level"
              name="experience_level"
              value={formData.experience_level}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-emerald-500/50"
          >
            {loading ? 'Getting Recommendations...' : 'Get AI Recommendations'}
          </button>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/30 border border-red-600 rounded-xl p-4">
          <p className="text-red-200">Error: {error}</p>
        </div>
      )}

      {/* Recommendations Results */}
      {recommendations && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">Recommended Repositories</h2>
          
          {Array.isArray(recommendations) ? (
            <div className="grid gap-6">
              {recommendations.map((repo, index) => (
                <div key={index} className="bg-zinc-800/60 backdrop-blur-sm border border-zinc-700 rounded-xl p-6 hover:border-emerald-500/50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-emerald-400">{repo.name}</h3>
                      <p className="text-sm text-zinc-400 mt-1">{repo.description}</p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-900/50 border border-emerald-700 text-emerald-300 text-sm rounded-full">
                      {repo.difficulty}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-white font-semibold text-sm mb-1">Why It's a Good Fit</p>
                      <p className="text-zinc-300 text-sm">{repo.fit}</p>
                    </div>
                    
                    <div>
                      <p className="text-white font-semibold text-sm mb-1">First Contribution</p>
                      <p className="text-zinc-300 text-sm">{repo.firstContribution}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-zinc-800/60 backdrop-blur-sm border border-zinc-700 rounded-xl p-6">
              <p className="text-zinc-300">{recommendations.message}</p>
              <p className="text-zinc-400 mt-2 whitespace-pre-wrap">{recommendations.recommendations}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default RecommendationsComponent
