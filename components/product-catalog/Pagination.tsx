'use client';

import React from 'react';
import type { PaginationProps } from '@/types/product-catalog';

/**
 * Pagination component for product catalog
 * Provides page navigation controls with loading states
 */
export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  loading = false
}) => {
  // Don't render if there's only one page or no pages
  if (totalPages <= 1) {
    return null;
  }

  // Normalize currentPage to be within valid range
  const normalizedCurrentPage = Math.max(1, Math.min(currentPage, totalPages));

  // Calculate visible page numbers
  const getVisiblePages = () => {
    const delta = 2; // Number of pages to show on each side of current page
    const range = [];
    const rangeWithDots = [];

    // For small page counts, show all pages
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        range.push(i);
      }
      return range;
    }

    // Always include first page
    range.push(1);

    // Add pages around current page
    for (let i = Math.max(2, normalizedCurrentPage - delta); i <= Math.min(totalPages - 1, normalizedCurrentPage + delta); i++) {
      range.push(i);
    }

    // Always include last page if more than 1 page
    if (totalPages > 1) {
      range.push(totalPages);
    }

    // Remove duplicates and sort
    const uniqueRange = [...new Set(range)].sort((a, b) => a - b);

    // Add dots where there are gaps
    let prev = 0;
    for (const page of uniqueRange) {
      if (page - prev > 1) {
        rangeWithDots.push('...');
      }
      rangeWithDots.push(page);
      prev = page;
    }

    return rangeWithDots;
  };

  const visiblePages = getVisiblePages();

  const handlePageClick = (page: number) => {
    if (page !== normalizedCurrentPage && !loading) {
      onPageChange(page);
    }
  };

  const handlePrevious = () => {
    if (normalizedCurrentPage > 1 && !loading) {
      onPageChange(normalizedCurrentPage - 1);
    }
  };

  const handleNext = () => {
    if (normalizedCurrentPage < totalPages && !loading) {
      onPageChange(normalizedCurrentPage + 1);
    }
  };

  return (
    <nav 
      className="pagination" 
      role="navigation" 
      aria-label="Pagination Navigation"
    >
      <div className="pagination-container">
        {/* Previous button */}
        <button
          className={`pagination-button pagination-prev ${
            normalizedCurrentPage === 1 || loading ? 'disabled' : ''
          }`}
          onClick={handlePrevious}
          disabled={normalizedCurrentPage === 1 || loading}
          aria-label="Go to previous page"
        >
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 16 16" 
            fill="none"
            aria-hidden="true"
          >
            <path 
              d="M10 12L6 8L10 4" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
          Previous
        </button>

        {/* Page numbers */}
        <div className="pagination-pages">
          {visiblePages.map((page, index) => {
            if (page === '...') {
              return (
                <span 
                  key={`dots-${index}`} 
                  className="pagination-dots"
                  aria-hidden="true"
                >
                  ...
                </span>
              );
            }

            const pageNumber = page as number;
            const isActive = pageNumber === normalizedCurrentPage;

            return (
              <button
                key={pageNumber}
                className={`pagination-button pagination-page ${
                  isActive ? 'active' : ''
                } ${loading ? 'loading' : ''}`}
                onClick={() => handlePageClick(pageNumber)}
                disabled={loading}
                aria-label={`Go to page ${pageNumber}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {loading && isActive ? (
                  <div className="pagination-spinner" aria-hidden="true" />
                ) : (
                  pageNumber
                )}
              </button>
            );
          })}
        </div>

        {/* Next button */}
        <button
          className={`pagination-button pagination-next ${
            normalizedCurrentPage === totalPages || loading ? 'disabled' : ''
          }`}
          onClick={handleNext}
          disabled={normalizedCurrentPage === totalPages || loading}
          aria-label="Go to next page"
        >
          Next
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 16 16" 
            fill="none"
            aria-hidden="true"
          >
            <path 
              d="M6 4L10 8L6 12" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="pagination-loading-overlay" aria-hidden="true">
          <div className="pagination-loading-spinner" />
        </div>
      )}

      <style jsx>{`
        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          margin: 2rem 0;
          position: relative;
        }

        .pagination-container {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: white;
          border-radius: 8px;
          padding: 0.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .pagination-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          border: 1px solid #e5e7eb;
          background: white;
          color: #374151;
          font-size: 0.875rem;
          font-weight: 500;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 2.5rem;
          height: 2.5rem;
        }

        .pagination-button:hover:not(.disabled):not(:disabled) {
          background: #f9fafb;
          border-color: #d1d5db;
        }

        .pagination-button:focus {
          outline: none;
          ring: 2px solid #3b82f6;
          ring-offset: 2px;
        }

        .pagination-button.disabled,
        .pagination-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: #f9fafb;
        }

        .pagination-button.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .pagination-button.active:hover {
          background: #2563eb;
          border-color: #2563eb;
        }

        .pagination-button.loading {
          cursor: wait;
        }

        .pagination-pages {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .pagination-page {
          min-width: 2.5rem;
          padding: 0.5rem;
        }

        .pagination-dots {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem;
          color: #6b7280;
          font-weight: 500;
          min-width: 2.5rem;
        }

        .pagination-prev,
        .pagination-next {
          font-weight: 500;
        }

        .pagination-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .pagination-loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
        }

        .pagination-loading-spinner {
          width: 24px;
          height: 24px;
          border: 3px solid #e5e7eb;
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* Mobile responsive */
        @media (max-width: 640px) {
          .pagination-container {
            gap: 0.25rem;
            padding: 0.25rem;
          }

          .pagination-button {
            padding: 0.375rem 0.5rem;
            font-size: 0.8125rem;
            min-width: 2.25rem;
            height: 2.25rem;
          }

          .pagination-prev span,
          .pagination-next span {
            display: none;
          }

          .pagination-prev,
          .pagination-next {
            min-width: 2.25rem;
            padding: 0.375rem;
          }
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .pagination-button {
            border-width: 2px;
          }

          .pagination-button.active {
            background: #000;
            border-color: #000;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .pagination-button {
            transition: none;
          }

          .pagination-spinner,
          .pagination-loading-spinner {
            animation: none;
          }
        }
      `}</style>
    </nav>
  );
};

export default Pagination;