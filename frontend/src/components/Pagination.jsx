import { useState, useEffect, useMemo } from 'react';

export function usePagination(items, pageSize = 10) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [items]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  const goToPage = (nextPage) => {
    setPage(Math.min(Math.max(1, nextPage), totalPages));
  };

  return {
    page,
    pageItems,
    totalPages,
    pageSize,
    totalItems: items.length,
    goToPage,
    goNext: () => goToPage(page + 1),
    goPrev: () => goToPage(page - 1),
    hasPrev: page > 1,
    hasNext: page < totalPages,
  };
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  itemLabel = 'tickets',
  compact = false,
  ariaLabel = 'Pagination',
}) {
  if (totalItems <= pageSize) {
    return null;
  }

  if (compact) {
    return (
      <nav className="pagination pagination--compact" aria-label={ariaLabel}>
        <span className="pagination__info">
          Page {page} of {totalPages}
        </span>
        <div className="pagination__controls">
          <button
            type="button"
            className="pagination__btn pagination__btn--icon"
            onClick={onPrev}
            disabled={!hasPrev}
            aria-label="Previous page"
          >
            ‹
          </button>
          <button
            type="button"
            className="pagination__btn pagination__btn--icon"
            onClick={onNext}
            disabled={!hasNext}
            aria-label="Next page"
          >
            ›
          </button>
        </div>
      </nav>
    );
  }

  const pages = getPageNumbers(page, totalPages);

  return (
    <nav className="pagination" aria-label={ariaLabel}>
      <span className="pagination__info">
        Page {page} of {totalPages} ({totalItems} {itemLabel})
      </span>

      <div className="pagination__controls">
        <button
          type="button"
          className="pagination__btn"
          onClick={onPrev}
          disabled={!hasPrev}
          aria-label="Previous page"
        >
          ‹ Prev
        </button>

        <div className="pagination__pages">
          {pages.map((p, index) =>
            p === '…' ? (
              <span key={`ellipsis-${index}`} className="pagination__ellipsis">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                className={`pagination__page${p === page ? ' pagination__page--active' : ''}`}
                onClick={() => onPageChange(p)}
                aria-label={`Page ${p}`}
                aria-current={p === page ? 'page' : undefined}
              >
                {p}
              </button>
            )
          )}
        </div>

        <button
          type="button"
          className="pagination__btn"
          onClick={onNext}
          disabled={!hasNext}
          aria-label="Next page"
        >
          Next ›
        </button>
      </div>
    </nav>
  );
}

function getPageNumbers(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = [1];

  if (current > 3) pages.push('…');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) pages.push('…');

  pages.push(total);
  return pages;
}
