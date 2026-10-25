interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  lang?: 'vi' | 'en';
}

function getPageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const items: (number | string)[] = [];
  items.push(1);

  if (current > 3) {
    items.push('...');
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    items.push(i);
  }

  if (current < total - 2) {
    items.push('..');
  }

  items.push(total);
  return items;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  lang = 'vi'
}: PaginationProps) {
  if (totalItems <= 0) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(totalItems, currentPage * pageSize);
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <div className="table-pagination">
      <div className="pagination-info">
        {lang === 'vi' ? (
          <>
            Hiển thị <b>{start}–{end}</b> trên <b>{totalItems}</b>
          </>
        ) : (
          <>
            Showing <b>{start}–{end}</b> of <b>{totalItems}</b>
          </>
        )}
      </div>

      <div className="pagination-controls">
        <button
          type="button"
          className="page-nav-btn"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label={lang === 'vi' ? 'Trang trước' : 'Previous page'}
        >
          ‹
        </button>

        <div className="page-pill-group">
          {pageNumbers.map((p, idx) => {
            if (typeof p === 'string') {
              return (
                <span key={`ellipsis-${idx}`} className="page-ellipsis">
                  …
                </span>
              );
            }
            return (
              <button
                key={p}
                type="button"
                className={`page-pill ${p === currentPage ? 'active' : ''}`}
                onClick={() => onPageChange(p)}
              >
                {p}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="page-nav-btn"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label={lang === 'vi' ? 'Trang sau' : 'Next page'}
        >
          ›
        </button>
      </div>
    </div>
  );
}
