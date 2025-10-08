import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MobileFilterDrawer from '../MobileFilterDrawer';
import type { FilterOptions, FilterState } from '@/types/product-catalog';

// Mock data
const mockFilters: FilterOptions = {
  availableSizes: ['XS', 'S', 'M', 'L', 'XL'],
  availableColors: [
    { name: 'Red', hex: '#FF0000', imageUrl: '/red.jpg' },
    { name: 'Blue', hex: '#0000FF', imageUrl: '/blue.jpg' },
    { name: 'Green', hex: '#00FF00', imageUrl: '/green.jpg' }
  ],
  availableBrands: ['Brand A', 'Brand B', 'Brand C'],
  priceRange: [0, 200]
};

const mockCurrentFilters: FilterState = {
  sizes: [],
  colors: [],
  brands: [],
  priceRange: [0, 200],
  onSale: false
};

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  filters: mockFilters,
  currentFilters: mockCurrentFilters,
  onFilterChange: vi.fn(),
  onClearFilters: vi.fn(),
  productCount: 25
};

// Mock body style for scroll prevention tests
Object.defineProperty(document.body, 'style', {
  value: {
    overflow: 'unset'
  },
  writable: true
});

describe('MobileFilterDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.style.overflow = 'unset';
  });

  describe('Rendering', () => {
    it('renders when open', () => {
      render(<MobileFilterDrawer {...defaultProps} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Filters')).toBeInTheDocument();
      expect(screen.getByText('25 products found')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(<MobileFilterDrawer {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders all filter sections', () => {
      render(<MobileFilterDrawer {...defaultProps} />);
      
      expect(screen.getByText('Size')).toBeInTheDocument();
      expect(screen.getByText('Color')).toBeInTheDocument();
      expect(screen.getByText('Brand')).toBeInTheDocument();
      expect(screen.getByText('Price Range')).toBeInTheDocument();
      expect(screen.getByText('Special Offers')).toBeInTheDocument();
    });

    it('renders size options', () => {
      render(<MobileFilterDrawer {...defaultProps} />);
      
      mockFilters.availableSizes.forEach(size => {
        expect(screen.getByText(size)).toBeInTheDocument();
      });
    });

    it('renders color swatches', () => {
      render(<MobileFilterDrawer {...defaultProps} />);
      
      mockFilters.availableColors.forEach(color => {
        const colorButton = screen.getByLabelText(`Filter by ${color.name}`);
        expect(colorButton).toBeInTheDocument();
        expect(colorButton).toHaveStyle(`background-color: ${color.hex}`);
      });
    });

    it('renders brand options', () => {
      render(<MobileFilterDrawer {...defaultProps} />);
      
      mockFilters.availableBrands.forEach(brand => {
        expect(screen.getByText(brand)).toBeInTheDocument();
      });
    });
  });

  describe('Modal Behavior', () => {
    it('has proper ARIA attributes', () => {
      render(<MobileFilterDrawer {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'mobile-filter-title');
    });

    it('prevents body scroll when open', () => {
      render(<MobileFilterDrawer {...defaultProps} />);
      
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body scroll when closed', () => {
      const { rerender } = render(<MobileFilterDrawer {...defaultProps} />);
      
      rerender(<MobileFilterDrawer {...defaultProps} isOpen={false} />);
      
      expect(document.body.style.overflow).toBe('unset');
    });

    it('closes on backdrop click', () => {
      render(<MobileFilterDrawer {...defaultProps} />);
      
      const backdrop = screen.getByRole('dialog');
      fireEvent.click(backdrop);
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('closes on close button click', () => {
      render(<MobileFilterDrawer {...defaultProps} />);
      
      const closeButton = screen.getByLabelText('Close filters');
      fireEvent.click(closeButton);
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('closes on escape key press', () => {
      render(<MobileFilterDrawer {...defaultProps} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('does not close on escape when drawer is closed', () => {
      render(<MobileFilterDrawer {...defaultProps} isOpen={false} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('Filter Interactions', () => {
    it('handles size filter changes', () => {
      render(<MobileFilterDrawer {...defaultProps} />);
      
      const sizeCheckbox = screen.getByText('M').closest('label')?.querySelector('input');
      expect(sizeCheckbox).toBeInTheDocument();
      
      if (sizeCheckbox) {
        fireEvent.click(sizeCheckbox);
        
        expect(defaultProps.onFilterChange).toHaveBeenCalledWith({
          ...mockCurrentFilters,
          sizes: ['M']
        });
      }
    });

    it('handles color filter changes', () => {
      render(<MobileFilterDrawer {...defaultProps} />);
      
      const redColorButton = screen.getByLabelText('Filter by Red');
      fireEvent.click(redColorButton);
      
      expect(defaultProps.onFilterChange).toHaveBeenCalledWith({
        ...mockCurrentFilters,
        colors: ['Red']
      });
    });

    it('handles brand filter changes', () => {
      render(<MobileFilterDrawer {...defaultProps} />);
      
      const brandCheckbox = screen.getByText('Brand A').closest('label')?.querySelector('input');
      expect(brandCheckbox).toBeInTheDocument();
      
      if (brandCheckbox) {
        fireEvent.click(brandCheckbox);
        
        expect(defaultProps.onFilterChange).toHaveBeenCalledWith({
          ...mockCurrentFilters,
          brands: ['Brand A']
        });
      }
    });

    it('handles sale filter toggle', () => {
      render(<MobileFilterDrawer {...defaultProps} />);
      
      const saleCheckbox = screen.getByText('On Sale').closest('label')?.querySelector('input');
      expect(saleCheckbox).toBeInTheDocument();
      
      if (saleCheckbox) {
        fireEvent.click(saleCheckbox);
        
        expect(defaultProps.onFilterChange).toHaveBeenCalledWith({
          ...mockCurrentFilters,
          onSale: true
        });
      }
    });

    it('handles price range changes', () => {
      render(<MobileFilterDrawer {...defaultProps} />);
      
      const minPriceInput = screen.getByPlaceholderText('Min');
      fireEvent.change(minPriceInput, { target: { value: '50' } });
      
      expect(defaultProps.onFilterChange).toHaveBeenCalledWith({
        ...mockCurrentFilters,
        priceRange: [50, 200]
      });
    });
  });

  describe('Filter Section Collapsing', () => {
    it('toggles size section', () => {
      render(<MobileFilterDrawer {...defaultProps} />);
      
      const sizeButton = screen.getByRole('button', { name: /size/i });
      
      // Initially expanded
      expect(sizeButton).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByText('XS')).toBeInTheDocument();
      
      // Collapse
      fireEvent.click(sizeButton);
      expect(sizeButton).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByText('XS')).not.toBeInTheDocument();
      
      // Expand again
      fireEvent.click(sizeButton);
      expect(sizeButton).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByText('XS')).toBeInTheDocument();
    });

    it('shows correct chevron rotation', () => {
      render(<MobileFilterDrawer {...defaultProps} />);
      
      const sizeButton = screen.getByRole('button', { name: /size/i });
      const chevron = sizeButton.querySelector('svg');
      
      // Initially expanded (rotated)
      expect(chevron).toHaveClass('rotate-180');
      
      // Collapse (not rotated)
      fireEvent.click(sizeButton);
      expect(chevron).not.toHaveClass('rotate-180');
    });
  });

  describe('Clear Filters', () => {
    it('shows clear button when filters are active', () => {
      const propsWithFilters = {
        ...defaultProps,
        currentFilters: {
          ...mockCurrentFilters,
          sizes: ['M'],
          colors: ['Red']
        }
      };
      
      render(<MobileFilterDrawer {...propsWithFilters} />);
      
      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });

    it('does not show clear button when no filters are active', () => {
      render(<MobileFilterDrawer {...defaultProps} />);
      
      expect(screen.queryByText('Clear All')).not.toBeInTheDocument();
    });

    it('calls onClearFilters when clear button is clicked', () => {
      const propsWithFilters = {
        ...defaultProps,
        currentFilters: {
          ...mockCurrentFilters,
          sizes: ['M']
        }
      };
      
      render(<MobileFilterDrawer {...propsWithFilters} />);
      
      const clearButton = screen.getByText('Clear All');
      fireEvent.click(clearButton);
      
      expect(defaultProps.onClearFilters).toHaveBeenCalledTimes(1);
    });
  });

  describe('Apply Filters Button', () => {
    it('closes drawer when apply button is clicked', () => {
      render(<MobileFilterDrawer {...defaultProps} />);
      
      const applyButton = screen.getByText('Apply Filters');
      fireEvent.click(applyButton);
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Selected Filters Display', () => {
    it('shows selected colors', () => {
      const propsWithSelectedColors = {
        ...defaultProps,
        currentFilters: {
          ...mockCurrentFilters,
          colors: ['Red', 'Blue']
        }
      };
      
      render(<MobileFilterDrawer {...propsWithSelectedColors} />);
      
      expect(screen.getByText('Selected: Red, Blue')).toBeInTheDocument();
    });

    it('highlights selected color swatches', () => {
      const propsWithSelectedColors = {
        ...defaultProps,
        currentFilters: {
          ...mockCurrentFilters,
          colors: ['Red']
        }
      };
      
      render(<MobileFilterDrawer {...propsWithSelectedColors} />);
      
      const redButton = screen.getByLabelText('Filter by Red');
      expect(redButton).toHaveClass('border-gray-900', 'ring-2', 'ring-blue-500');
    });

    it('shows checked state for selected sizes', () => {
      const propsWithSelectedSizes = {
        ...defaultProps,
        currentFilters: {
          ...mockCurrentFilters,
          sizes: ['M']
        }
      };
      
      render(<MobileFilterDrawer {...propsWithSelectedSizes} />);
      
      const sizeCheckbox = screen.getByText('M').closest('label')?.querySelector('input');
      expect(sizeCheckbox).toBeChecked();
    });
  });

  describe('Touch Gestures', () => {
    it('handles touch events for swipe to close', () => {
      render(<MobileFilterDrawer {...defaultProps} />);
      
      const drawer = screen.getByRole('dialog').querySelector('div[class*="w-80"]');
      expect(drawer).toBeInTheDocument();
      
      if (drawer) {
        // Simulate swipe left gesture
        fireEvent.touchStart(drawer, {
          touches: [{ clientX: 200 }]
        });
        
        fireEvent.touchMove(drawer, {
          touches: [{ clientX: 50 }]
        });
        
        fireEvent.touchEnd(drawer);
        
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
      }
    });

    it('does not close on small swipe', () => {
      render(<MobileFilterDrawer {...defaultProps} />);
      
      const drawer = screen.getByRole('dialog').querySelector('div[class*="w-80"]');
      expect(drawer).toBeInTheDocument();
      
      if (drawer) {
        // Simulate small swipe left gesture
        fireEvent.touchStart(drawer, {
          touches: [{ clientX: 200 }]
        });
        
        fireEvent.touchMove(drawer, {
          touches: [{ clientX: 150 }]
        });
        
        fireEvent.touchEnd(drawer);
        
        expect(defaultProps.onClose).not.toHaveBeenCalled();
      }
    });
  });

  describe('Focus Management', () => {
    it('focuses first focusable element when opened', async () => {
      render(<MobileFilterDrawer {...defaultProps} />);
      
      await waitFor(() => {
        const closeButton = screen.getByLabelText('Close filters');
        expect(closeButton).toHaveFocus();
      });
    });
  });

  describe('Product Count Display', () => {
    it('displays singular product count', () => {
      render(<MobileFilterDrawer {...defaultProps} productCount={1} />);
      
      expect(screen.getByText('1 product found')).toBeInTheDocument();
    });

    it('displays plural product count', () => {
      render(<MobileFilterDrawer {...defaultProps} productCount={25} />);
      
      expect(screen.getByText('25 products found')).toBeInTheDocument();
    });

    it('displays zero product count', () => {
      render(<MobileFilterDrawer {...defaultProps} productCount={0} />);
      
      expect(screen.getByText('0 products found')).toBeInTheDocument();
    });
  });

  describe('Animation Classes', () => {
    it('applies correct transform classes when open', () => {
      render(<MobileFilterDrawer {...defaultProps} />);
      
      const drawer = screen.getByRole('dialog').querySelector('div[class*="w-80"]');
      expect(drawer).toHaveClass('translate-x-0');
    });

    it('applies backdrop opacity when open', () => {
      render(<MobileFilterDrawer {...defaultProps} />);
      
      const backdrop = screen.getByRole('dialog');
      expect(backdrop).toHaveClass('bg-black', 'bg-opacity-50');
    });
  });
});