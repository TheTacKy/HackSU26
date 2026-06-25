import PropTypes from 'prop-types'

function Pagination({ pagination, currentPage, onPageChange, loading }) {
  if (!pagination || pagination.total_pages <= 1) {
    return null
  }

  const pageNumbers = Array.from(
    { length: pagination.total_pages },
    (_, index) => index + 1
  )

  return (
    <div className="mt-8 flex justify-center items-center gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || loading}
        className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
      >
        Previous
      </button>
      
      {pageNumbers.map((pageNum) => (
        <button
          key={pageNum}
          onClick={() => onPageChange(pageNum)}
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
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === pagination.total_pages || loading}
        className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
      >
        Next
      </button>
    </div>
  )
}

Pagination.propTypes = {
  pagination: PropTypes.shape({
    current_page: PropTypes.number,
    total_pages: PropTypes.number,
    total_repos: PropTypes.number,
  }),
  currentPage: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
}

export default Pagination
