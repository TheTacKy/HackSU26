import PropTypes from 'prop-types'

function RepositoryCard({ repo }) {
  return (
    <div className="bg-zinc-800/60 backdrop-blur-sm border border-zinc-700 rounded-xl p-6 hover:border-sky-500/50 transition-all duration-200 flex flex-col">
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
  )
}

RepositoryCard.propTypes = {
  repo: PropTypes.shape({
    name: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
    stars: PropTypes.number,
    language: PropTypes.string,
    description: PropTypes.string,
    topics: PropTypes.arrayOf(PropTypes.string),
    issues: PropTypes.arrayOf(PropTypes.shape({
      title: PropTypes.string,
      url: PropTypes.string,
      number: PropTypes.number,
    })),
    issues_count: PropTypes.number,
  }).isRequired,
}

export default RepositoryCard
