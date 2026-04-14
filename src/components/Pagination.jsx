function buildPageTokens(currentPage, totalPages) {
  const tokens = [];
  const visible = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);

  for (let page = 1; page <= totalPages; page += 1) {
    if (visible.has(page) && page >= 1 && page <= totalPages) {
      tokens.push(page);
    }
  }

  const sorted = [...new Set(tokens)].sort((a, b) => a - b);
  const output = [];

  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) {
      output.push("ellipsis-" + page);
    }
    output.push(page);
  });

  return output;
}

function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) {
    return null;
  }

  const pageTokens = buildPageTokens(currentPage, totalPages);

  return (
    <div className="pagination">
      <button
        type="button"
        className="btn btn-outline"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </button>

      <div className="pagination__pages">
        {pageTokens.map((token) => {
          if (typeof token === "string") {
            return (
              <span key={token} className="pagination__ellipsis" aria-hidden="true">
                ...
              </span>
            );
          }

          return (
            <button
              type="button"
              key={token}
              className={`pagination__page ${token === currentPage ? "is-active" : ""}`}
              onClick={() => onPageChange(token)}
            >
              {token}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="btn btn-outline"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </button>
    </div>
  );
}

export default Pagination;
