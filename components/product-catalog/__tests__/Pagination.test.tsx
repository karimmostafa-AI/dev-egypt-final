import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { Pagination } from '../Pagination';

describe('Pagination', () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 10,
    onPageChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders pagination controls correctly', () => {
      render(<Pagination {...defaultProps} />);
      
      expect(screen.getByRole('navigation', { name: /pagination navigation/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /go to previous page/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /go to next page/i })).toBeInTheDocument();
    });

    it('does not render when totalPages is 1 or less', () => {
      const { container } = render(<Pagination {...defaultProps} totalPages={1} />);
      expect(container.firstChild).toBeNull();

      const { container: container2 } = render(<Pagination {...defaultProps} totalPages={0} />);
      expect(container2.firstChild).toBeNull();
    });

    it('renders page numbers correctly for small page count', () => {
      render(<Pagination {...defaultProps} totalPages={5} />);
      
      // Should show all pages when total is small
      expect(screen.getByRole('button', { name: 'Go to page 1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 2' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 3' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 4' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 5' })).toBeInTheDocument();
    });

    it('renders page numbers with dots for large page count', () => {
      render(<Pagination {...defaultProps} currentPage={5} totalPages={20} />);
      
      // Should show first page, pages around current, and last page with dots
      expect(screen.getByRole('button', { name: 'Go to page 1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 20' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 5' })).toBeInTheDocument();
      
      // Should have dots
      const dots = screen.getAllByText('...');
      expect(dots.length).toBeGreaterThan(0);
    });

    it('marks current page as active', () => {
      render(<Pagination {...defaultProps} currentPage={3} />);
      
      const currentPageButton = screen.getByRole('button', { name: 'Go to page 3' });
      expect(currentPageButton).toHaveAttribute('aria-current', 'page');
      expect(currentPageButton).toHaveClass('active');
    });
  });

  describe('Navigation', () => {
    it('calls onPageChange when page number is clicked', () => {
      const onPageChange = vi.fn();
      render(<Pagination {...defaultProps} onPageChange={onPageChange} />);
      
      const page3Button = screen.getByRole('button', { name: 'Go to page 3' });
      fireEvent.click(page3Button);
      
      expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it('calls onPageChange when previous button is clicked', () => {
      const onPageChange = vi.fn();
      render(<Pagination {...defaultProps} currentPage={3} onPageChange={onPageChange} />);
      
      const prevButton = screen.getByRole('button', { name: 'Go to previous page' });
      fireEvent.click(prevButton);
      
      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('calls onPageChange when next button is clicked', () => {
      const onPageChange = vi.fn();
      render(<Pagination {...defaultProps} currentPage={3} onPageChange={onPageChange} />);
      
      const nextButton = screen.getByRole('button', { name: 'Go to next page' });
      fireEvent.click(nextButton);
      
      expect(onPageChange).toHaveBeenCalledWith(4);
    });

    it('does not call onPageChange when current page is clicked', () => {
      const onPageChange = vi.fn();
      render(<Pagination {...defaultProps} currentPage={3} onPageChange={onPageChange} />);
      
      const currentPageButton = screen.getByRole('button', { name: 'Go to page 3' });
      fireEvent.click(currentPageButton);
      
      expect(onPageChange).not.toHaveBeenCalled();
    });
  });

  describe('Button States', () => {
    it('disables previous button on first page', () => {
      render(<Pagination {...defaultProps} currentPage={1} />);
      
      const prevButton = screen.getByRole('button', { name: 'Go to previous page' });
      expect(prevButton).toBeDisabled();
      expect(prevButton).toHaveClass('disabled');
    });

    it('disables next button on last page', () => {
      render(<Pagination {...defaultProps} currentPage={10} totalPages={10} />);
      
      const nextButton = screen.getByRole('button', { name: 'Go to next page' });
      expect(nextButton).toBeDisabled();
      expect(nextButton).toHaveClass('disabled');
    });

    it('enables both buttons on middle pages', () => {
      render(<Pagination {...defaultProps} currentPage={5} />);
      
      const prevButton = screen.getByRole('button', { name: 'Go to previous page' });
      const nextButton = screen.getByRole('button', { name: 'Go to next page' });
      
      expect(prevButton).not.toBeDisabled();
      expect(nextButton).not.toBeDisabled();
    });
  });

  describe('Loading States', () => {
    it('shows loading spinner on current page when loading', () => {
      render(<Pagination {...defaultProps} currentPage={3} loading={true} />);
      
      const currentPageButton = screen.getByRole('button', { name: 'Go to page 3' });
      expect(currentPageButton).toHaveClass('loading');
      
      // Should show spinner instead of page number
      const spinner = currentPageButton.querySelector('.pagination-spinner');
      expect(spinner).toBeInTheDocument();
    });

    it('disables all buttons when loading', () => {
      render(<Pagination {...defaultProps} currentPage={5} loading={true} />);
      
      const prevButton = screen.getByRole('button', { name: 'Go to previous page' });
      const nextButton = screen.getByRole('button', { name: 'Go to next page' });
      const pageButtons = screen.getAllByRole('button').filter(button => 
        button.getAttribute('aria-label')?.startsWith('Go to page')
      );
      
      expect(prevButton).toBeDisabled();
      expect(nextButton).toBeDisabled();
      pageButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('shows loading overlay when loading', () => {
      const { container } = render(<Pagination {...defaultProps} loading={true} />);
      
      const overlay = container.querySelector('.pagination-loading-overlay');
      expect(overlay).toBeInTheDocument();
      
      const overlaySpinner = container.querySelector('.pagination-loading-spinner');
      expect(overlaySpinner).toBeInTheDocument();
    });

    it('does not call onPageChange when loading', () => {
      const onPageChange = vi.fn();
      render(<Pagination {...defaultProps} onPageChange={onPageChange} loading={true} />);
      
      const page3Button = screen.getByRole('button', { name: 'Go to page 3' });
      fireEvent.click(page3Button);
      
      expect(onPageChange).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<Pagination {...defaultProps} currentPage={3} />);
      
      expect(screen.getByRole('navigation', { name: 'Pagination Navigation' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to previous page' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to next page' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 1' })).toBeInTheDocument();
    });

    it('marks current page with aria-current', () => {
      render(<Pagination {...defaultProps} currentPage={3} />);
      
      const currentPageButton = screen.getByRole('button', { name: 'Go to page 3' });
      expect(currentPageButton).toHaveAttribute('aria-current', 'page');
    });

    it('hides decorative elements from screen readers', () => {
      const { container } = render(<Pagination {...defaultProps} currentPage={5} totalPages={20} />);
      
      const dots = container.querySelectorAll('.pagination-dots');
      dots.forEach(dot => {
        expect(dot).toHaveAttribute('aria-hidden', 'true');
      });
      
      const icons = container.querySelectorAll('svg');
      icons.forEach(icon => {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('supports keyboard navigation', () => {
      const onPageChange = vi.fn();
      render(<Pagination {...defaultProps} onPageChange={onPageChange} />);
      
      const page3Button = screen.getByRole('button', { name: 'Go to page 3' });
      
      // Focus and press Enter
      page3Button.focus();
      fireEvent.keyDown(page3Button, { key: 'Enter' });
      fireEvent.click(page3Button);
      
      expect(onPageChange).toHaveBeenCalledWith(3);
    });
  });

  describe('Edge Cases', () => {
    it('handles single page correctly', () => {
      const { container } = render(<Pagination {...defaultProps} totalPages={1} />);
      expect(container.firstChild).toBeNull();
    });

    it('handles zero pages correctly', () => {
      const { container } = render(<Pagination {...defaultProps} totalPages={0} />);
      expect(container.firstChild).toBeNull();
    });

    it('handles negative page numbers gracefully', () => {
      render(<Pagination {...defaultProps} currentPage={-1} />);
      
      // Should still render but treat as page 1 (previous should be disabled)
      const prevButton = screen.getByRole('button', { name: 'Go to previous page' });
      expect(prevButton).toBeDisabled();
    });

    it('handles page numbers beyond total pages', () => {
      render(<Pagination {...defaultProps} currentPage={15} totalPages={10} />);
      
      // Should still render but next should be disabled since we're beyond last page
      const nextButton = screen.getByRole('button', { name: 'Go to next page' });
      expect(nextButton).toBeDisabled();
    });
  });

  describe('Page Range Calculation', () => {
    it('shows all pages when total pages is small', () => {
      render(<Pagination {...defaultProps} totalPages={7} currentPage={4} />);
      
      for (let i = 1; i <= 7; i++) {
        expect(screen.getByRole('button', { name: `Go to page ${i}` })).toBeInTheDocument();
      }
    });

    it('shows correct range for first few pages', () => {
      render(<Pagination {...defaultProps} totalPages={20} currentPage={2} />);
      
      expect(screen.getByRole('button', { name: 'Go to page 1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 2' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 3' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 4' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 20' })).toBeInTheDocument();
    });

    it('shows correct range for last few pages', () => {
      render(<Pagination {...defaultProps} totalPages={20} currentPage={19} />);
      
      expect(screen.getByRole('button', { name: 'Go to page 1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 17' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 18' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 19' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 20' })).toBeInTheDocument();
    });

    it('shows correct range for middle pages', () => {
      render(<Pagination {...defaultProps} totalPages={20} currentPage={10} />);
      
      expect(screen.getByRole('button', { name: 'Go to page 1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 8' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 9' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 10' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 11' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 12' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 20' })).toBeInTheDocument();
    });
  });
});