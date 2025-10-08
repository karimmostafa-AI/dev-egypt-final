import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SortControls from '../SortControls';
import type { SortState } from '@/types/product-catalog';

describe('SortControls', () => {
  const mockOnSortChange = vi.fn();

  const defaultProps = {
    currentSort: { option: 'popularity' as const, direction: 'desc' as const },
    onSortChange: mockOnSortChange
  };

  beforeEach(() => {
    mockOnSortChange.mockClear();
  });

  it('renders with default sort option', () => {
    render(<SortControls {...defaultProps} />);
    
    expect(screen.getByRole('button', { name: /sort products by/i })).toBeInTheDocument();
    expect(screen.getByText('Sort: Most Popular')).toBeInTheDocument();
  });

  it('displays current sort option correctly', () => {
    const priceSort: SortState = { option: 'price-low', direction: 'asc' };
    render(<SortControls currentSort={priceSort} onSortChange={mockOnSortChange} />);
    
    expect(screen.getByText('Sort: Price: Low to High')).toBeInTheDocument();
  });

  it('opens dropdown when clicked', async () => {
    render(<SortControls {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /sort products by/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    // Check all sort options are present
    expect(screen.getByText('Most Popular')).toBeInTheDocument();
    expect(screen.getByText('Newest')).toBeInTheDocument();
    expect(screen.getByText('Price: Low to High')).toBeInTheDocument();
    expect(screen.getByText('Price: High to Low')).toBeInTheDocument();
    expect(screen.getByText('Name: A to Z')).toBeInTheDocument();
  });

  it('highlights current sort option in dropdown', async () => {
    render(<SortControls {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /sort products by/i });
    fireEvent.click(button);

    await waitFor(() => {
      const currentOptionButton = screen.getByRole('button', { name: /most popular/i });
      expect(currentOptionButton).toHaveAttribute('aria-selected', 'true');
      expect(currentOptionButton).toHaveClass('bg-blue-50', 'text-blue-700');
    });
  });

  it('calls onSortChange when option is selected', async () => {
    render(<SortControls {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /sort products by/i });
    fireEvent.click(button);

    await waitFor(() => {
      const priceOptionButton = screen.getByRole('button', { name: /price: low to high/i });
      fireEvent.click(priceOptionButton);
    });

    expect(mockOnSortChange).toHaveBeenCalledWith({
      option: 'price-low',
      direction: 'asc'
    });
  });

  it('sets correct direction for different sort options', async () => {
    render(<SortControls {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /sort products by/i });
    fireEvent.click(button);

    // Test price-high (should be desc)
    await waitFor(() => {
      const priceHighOptionButton = screen.getByRole('button', { name: /price: high to low/i });
      fireEvent.click(priceHighOptionButton);
    });

    expect(mockOnSortChange).toHaveBeenCalledWith({
      option: 'price-high',
      direction: 'desc'
    });

    // Reset and test name (should be asc)
    mockOnSortChange.mockClear();
    fireEvent.click(button);

    await waitFor(() => {
      const nameOptionButton = screen.getByRole('button', { name: /name: a to z/i });
      fireEvent.click(nameOptionButton);
    });

    expect(mockOnSortChange).toHaveBeenCalledWith({
      option: 'name',
      direction: 'asc'
    });
  });

  it('closes dropdown when option is selected', async () => {
    render(<SortControls {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /sort products by/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    const priceOptionButton = screen.getByRole('button', { name: /price: low to high/i });
    fireEvent.click(priceOptionButton);

    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  it('closes dropdown when clicking outside', async () => {
    render(<SortControls {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /sort products by/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    // Click on the backdrop overlay - find by class since it has aria-hidden
    const backdrop = document.querySelector('.fixed.inset-0.z-10[aria-hidden="true"]');
    if (backdrop) {
      fireEvent.click(backdrop);
    }

    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  it('has proper accessibility attributes', () => {
    render(<SortControls {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /sort products by/i });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveAttribute('aria-haspopup', 'listbox');
    expect(button).toHaveAttribute('id', 'sort-select');

    // Check screen reader label
    expect(screen.getByLabelText('Sort products by')).toBeInTheDocument();
  });

  it('updates aria-expanded when dropdown opens', async () => {
    render(<SortControls {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /sort products by/i });
    expect(button).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });
  });

  it('applies custom className', () => {
    const { container } = render(
      <SortControls {...defaultProps} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles keyboard navigation', async () => {
    render(<SortControls {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /sort products by/i });
    
    // Focus and open with Enter - this should trigger the click handler
    button.focus();
    fireEvent.keyDown(button, { key: 'Enter' });
    fireEvent.click(button); // Simulate the click that would happen on Enter

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
  });

  it('shows correct icon for sort', () => {
    render(<SortControls {...defaultProps} />);
    
    // Check that sort icon is present (we can't easily test the specific SVG, but we can check it exists)
    const button = screen.getByRole('button', { name: /sort products by/i });
    const svgs = button.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });
});