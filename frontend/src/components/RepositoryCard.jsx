import PropTypes from 'prop-types'

export default function RepositoryCard({ repo, issueState, languages = [], onRetry, isSkeleton = false }) {
  if (isSkeleton) return <article className="repo-card skeleton-card" aria-hidden="true"><div className="skeleton h-4 w-28 rounded" /><div className="skeleton h-6 w-3/4 rounded mt-4" /><div className="space-y-2 my-6"><div className="skeleton h-3 w-full rounded" /><div className="skeleton h-3 w-5/6 rounded" /></div><div className="skeleton h-6 w-24 rounded-full" /><div className="issue-section"><div className="skeleton h-3 w-24 rounded mb-4" /><div className="skeleton h-3 w-full rounded mb-3" /><div className="skeleton h-3 w-4/5 rounded" /></div><div className="skeleton h-4 w-32 rounded mt-6" /></article>
  const issues = repo.issues || []
  const matches = languages.some(language => language.toLowerCase() === repo.language?.toLowerCase())
  const issueLink = issue => <a className="issue-link" key={issue.number} href={issue.url} target="_blank" rel="noreferrer"><span className="issue-dot" aria-hidden="true" /><span><span className="issue-number">#{issue.number}</span> {issue.title}</span><span aria-hidden="true">↗</span></a>
  return <article className="repo-card">
    <div className="repo-meta"><span className="repo-owner">{repo.full_name?.split('/')[0] || 'GitHub repository'}</span><span className="stars" aria-label={`${repo.stars || 0} stars`}><span aria-hidden="true">☆</span> {new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(repo.stars || 0)}</span></div>
    <h3><a href={repo.url} target="_blank" rel="noreferrer">{repo.name} <span aria-hidden="true">↗</span></a></h3>
    <p className="repo-description">{repo.description || 'Explore this project on GitHub to learn more.'}</p>
    <div className="repo-tags">{repo.language && <span className="language-tag"><span aria-hidden="true" />{repo.language}</span>}{repo.topics?.slice(0, 2).map(topic => <span key={topic} className="topic-tag">{topic}</span>)}</div>
    {matches && <p className="match-note"><span aria-hidden="true">✓</span> Matches your {repo.language} preference</p>}
    <div className="issue-section"><div className="issue-heading"><h4>Open issues</h4>{repo.issuesLoaded && issues.length > 0 && <span>{issues.length} suggestions</span>}</div>
      {issueState === 'error' ? <div className="issue-error"><p>Couldn’t load issues.</p><button onClick={onRetry}>Try again</button></div> : !repo.issuesLoaded ? <div role="status" aria-label="Loading open issues" className="space-y-3"><div className="skeleton h-3 w-full rounded" /><div className="skeleton h-3 w-4/5 rounded" /></div> : issues.length ? <>{issues.slice(0, 2).map(issueLink)}{issues.length > 2 && <details><summary>Show {issues.length - 2} more issues</summary>{issues.slice(2).map(issueLink)}</details>}</> : <p className="empty-issues">No open issues to suggest right now.</p>}
    </div>
    <a className="repo-action" href={repo.url} target="_blank" rel="noreferrer">Explore repository <span aria-hidden="true">↗</span></a>
  </article>
}
RepositoryCard.propTypes = { repo: PropTypes.object.isRequired, issueState: PropTypes.string, languages: PropTypes.arrayOf(PropTypes.string), onRetry: PropTypes.func, isSkeleton: PropTypes.bool }
