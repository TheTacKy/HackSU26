import PropTypes from 'prop-types'
import RepositoryCard from './RepositoryCard'

function RepositoryList({ repositories, pagination }) {
  if (!repositories || repositories.length === 0) {
    return (
      <div className="mt-6 p-8 bg-zinc-800/60 backdrop-blur-sm border border-zinc-700 rounded-xl text-center">
        <p className="text-zinc-400 text-lg">No repositories found. Try adjusting your search criteria.</p>
      </div>
    )
  }

  return (
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
        {repositories.map((repo, index) => (
          <RepositoryCard key={index} repo={repo} />
        ))}
      </div>
    </div>
  )
}

RepositoryList.propTypes = {
  repositories: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      url: PropTypes.string,
      stars: PropTypes.number,
      language: PropTypes.string,
      description: PropTypes.string,
      topics: PropTypes.arrayOf(PropTypes.string),
      issues: PropTypes.arrayOf(PropTypes.object),
      issues_count: PropTypes.number,
    })
  ),
  pagination: PropTypes.shape({
    current_page: PropTypes.number,
    total_pages: PropTypes.number,
    total_repos: PropTypes.number,
  }),
}

export default RepositoryList
