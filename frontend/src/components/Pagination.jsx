import PropTypes from 'prop-types'
export default function Pagination({ pagination, currentPage, onPageChange, loading }) {
  if (!pagination || pagination.total_pages <= 1) return null
  return <nav className="pagination" aria-label="Repository pages"><button disabled={currentPage === 1 || loading} onClick={() => onPageChange(currentPage - 1)}>← Previous</button><div className="page-numbers">{Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map(page => <button key={page} aria-label={`Page ${page}`} aria-current={page === currentPage ? 'page' : undefined} disabled={loading} onClick={() => onPageChange(page)}>{page}</button>)}</div><span className="mobile-page">{currentPage} / {pagination.total_pages}</span><button disabled={currentPage === pagination.total_pages || loading} onClick={() => onPageChange(currentPage + 1)}>Next →</button></nav>
}
Pagination.propTypes = { pagination: PropTypes.object, currentPage: PropTypes.number.isRequired, onPageChange: PropTypes.func.isRequired, loading: PropTypes.bool.isRequired }
