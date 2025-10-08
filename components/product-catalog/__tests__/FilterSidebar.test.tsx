import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FilterSidebar from '../FilterSidebar';
import type { FilterState, FilterOptions } from '@/types/product-catalog';

// Mock data for testing
const mockFilterOptions: FilterOptions = {
  availableSizes: ['XS', 'S', 'M', 'L', 'XL'],
  availableColors: [
    { name: 'Black', hex: '#000000', imageUrl: '/images/black.jpg' },
    { name: 'White', hex: '#FFFFFF', imageUrl: '/images/white.jpg' },
    { name: 'Navy', hex: '#1E3A8A', imageUrl: '/images/navy.jpg' },
  ],
  availableBrands: ['Brand A', 'Brand B', 'Brand C'],
  priceRange: [10, 200]
};

const initialFilters: FilterState = {
  sizes: [],
  colors: [],
  brands: [],
  priceRange: [10, 200],
  onSale: false
};

const mockProps = {
  filters: mockFilterOptions,
  currentFilters: initialFilters,
  onFilterChange: vi.fn(),
  onClearFilters: vi.fn(),
  productCount: 156
};

describe('FilterSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the filter sidebar with all sections', () => {
    render(<FilterSidebar {...mockProps} />);
    
    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByText('Size')).toBeInTheDocument();
    expect(screen.getByText('Color')).toBeInTheDocument();
    expect(screen.getByText('Brand')).toBeInTheDocument();
    expect(screen.getByText('Price Range')).toBeInTheDocument();
    expect(screen.getByText('Special Offers')).toBeInTheDocument();
  });

  it('displays product count correctly', () => {
    render(<FilterSidebar {...mockProps} />);
    
    expect(screen.getByText('156 products found')).toBeInTheDocument();
  });

  it('displays product count with singular form for 1 product', () => {
    render(<FilterSidebar {...mockProps} productCount={1} />);
    
    expect(screen.getByText('1 product found')).toBeInTheDocument();
  });

  it('shows clear all button when filters are active', () => {
    const activeFilters = {
      ...initialFilters,
      sizes: ['M']
    };
    
    render(<FilterSidebar {...mockProps} currentFilters={activeFilters} />);
    
    expect(screen.getByText('Clear All')).toBeInTheDocument();
  });

  it('hides clear all button when no filters are active', () => {
    render(<FilterSidebar {...mockProps} />);
    
    expect(screen.queryByText('Clear All')).not.toBeInTheDocument();
  });

  it('calls onClearFilters when clear all button is clicked', () => {
    const activeFilters = {
      ...initialFilters,
      sizes: ['M']
    };
    
    render(<FilterSidebar {...mockProps} currentFilters={activeFilters} />);
    
    fireEvent.click(screen.getByText('Clear All'));
    expect(mockProps.onClearFilters).toHaveBeenCalledTimes(1);
  });

  describe('Filter Sections', () => {
    it('toggles section visibility when header is clicked', () => {
      render(<FilterSidebar {...mockProps} />);
      
      const sizeSection = screen.getByRole('button', { name: /size/i });
      
      // Initially open, should show size options
      expect(screen.getByText('XS')).toBeInTheDocument();
      
      // Click to close
      fireEvent.click(sizeSection);
      expect(screen.queryByText('XS')).not.toBeInTheDocument();
      
      // Click to open again
      fireEvent.click(sizeSection);
      expect(screen.getByText('XS')).toBeInTheDocument();
    });

    it('has proper aria-expanded attributes', () => {
      render(<FilterSidebar {...mockProps} />);
      
      const sizeSection = screen.getByRole('button', { name: /size/i });
      expect(sizeSection).toHaveAttribute('aria-expanded', 'true');
      
      fireEvent.click(sizeSection);
      expect(sizeSection).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Size Filter', () => {
    it('renders all available sizes', () => {
      render(<FilterSidebar {...mockProps} />);
      
      mockFilterOptions.availableSizes.forEach(size => {
        expect(screen.getByText(size)).toBeInTheDocument();
      });
    });

    it('calls onFilterChange when size is selected', () => {
      render(<FilterSidebar {...mockProps} />);
      
      const sizeM = screen.getByLabelText('M');
      fireEvent.click(sizeM);
      
      expect(mockProps.onFilterChange).toHaveBeenCalledWith({
        ...initialFilters,
        sizes: ['M']
      });
    });

    it('shows selected sizes as checked', () => {
      const filtersWithSizes = {
        ...initialFilters,
        sizes: ['M', 'L']
      };
      
      render(<FilterSidebar {...mockProps} currentFilters={filtersWithSizes} />);
      
      expect(screen.getByLabelText('M')).toBeChecked();
      expect(screen.getByLabelText('L')).toBeChecked();
      expect(screen.getByLabelText('XS')).not.toBeChecked();
    });
  });

  describe('Color Filter', () => {
    it('renders all available colors', () => {
      render(<FilterSidebar {...mockProps} />);
      
      mockFilterOptions.availableColors.forEach(color => {
        const colorButton = screen.getByLabelText(`Filter by ${color.name}`);
        expect(colorButton).toBeInTheDocument();
        expect(colorButton).toHaveStyle(`background-color: ${color.hex}`);
      });
    });

    it('calls onFilterChange when color is selected', () => {
      render(<FilterSidebar {...mockProps} />);
      
      const blackColor = screen.getByLabelText('Filter by Black');
      fireEvent.click(blackColor);
      
      expect(mockProps.onFilterChange).toHaveBeenCalledWith({
        ...initialFilters,
        colors: ['Black']
      });
    });

    it('shows selected colors with different styling', () => {
      const filtersWithColors = {
        ...initialFilters,
        colors: ['Black', 'White']
      };
      
      render(<FilterSidebar {...mockProps} currentFilters={filtersWithColors} />);
      
      const blackColor = screen.getByLabelText('Filter by Black');
      const whiteColor = screen.getByLabelText('Filter by White');
      const navyColor = screen.getByLabelText('Filter by Navy');
      
      expect(blackColor).toHaveClass('border-gray-900', 'ring-2', 'ring-blue-500');
      expect(whiteColor).toHaveClass('border-gray-900', 'ring-2', 'ring-blue-500');
      expect(navyColor).not.toHaveClass('ring-2');
    });

    it('displays selected colors text', () => {
      const filtersWithColors = {
        ...initialFilters,
        colors: ['Black', 'White']
      };
      
      render(<FilterSidebar {...mockProps} currentFilters={filtersWithColors} />);
      
      expect(screen.getByText('Selected: Black, White')).toBeInTheDocument();
    });
  });

  describe('Brand Filter', () => {
    it('renders all available brands', () => {
      render(<FilterSidebar {...mockProps} />);
      
      mockFilterOptions.availableBrands.forEach(brand => {
        expect(screen.getByText(brand)).toBeInTheDocument();
      });
    });

    it('calls onFilterChange when brand is selected', () => {
      render(<FilterSidebar {...mockProps} />);
      
      const brandA = screen.getByLabelText('Brand A');
      fireEvent.click(brandA);
      
      expect(mockProps.onFilterChange).toHaveBeenCalledWith({
        ...initialFilters,
        brands: ['Brand A']
      });
    });

    it('shows selected brands as checked', () => {
      const filtersWithBrands = {
        ...initialFilters,
        brands: ['Brand A', 'Brand C']
      };
      
      render(<FilterSidebar {...mockProps} currentFilters={filtersWithBrands} />);
      
      expect(screen.getByLabelText('Brand A')).toBeChecked();
      expect(screen.getByLabelText('Brand C')).toBeChecked();
      expect(screen.getByLabelText('Brand B')).not.toBeChecked();
    });
  });

  describe('Sale Filter', () => {
    it('renders sale checkbox', () => {
      render(<FilterSidebar {...mockProps} />);
      
      expect(screen.getByLabelText('On Sale')).toBeInTheDocument();
    });

    it('calls onFilterChange when sale filter is toggled on', () => {
      render(<FilterSidebar {...mockProps} />);
      
      const saleCheckbox = screen.getByLabelText('On Sale');
      fireEvent.click(saleCheckbox);
      
      expect(mockProps.onFilterChange).toHaveBeenCalledWith({
        ...initialFilters,
        onSale: true
      });
    });

    it('shows sale checkbox as checked when filter is active', () => {
      const filtersWithSale = {
        ...initialFilters,
        onSale: true
      };
      
      render(<FilterSidebar {...mockProps} currentFilters={filtersWithSale} />);
      
      expect(screen.getByLabelText('On Sale')).toBeChecked();
    });
  });

  describe('Price Range Filter', () => {
    it('renders price range inputs with correct initial values', () => {
      render(<FilterSidebar {...mockProps} />);
      
      const minInput = screen.getByPlaceholderText('Min');
      const maxInput = screen.getByPlaceholderText('Max');
      
      expect(minInput).toHaveValue(10);
      expect(maxInput).toHaveValue(200);
    });

    it('calls onFilterChange when min price is changed', () => {
      render(<FilterSidebar {...mockProps} />);
      
      const minInput = screen.getByPlaceholderText('Min');
      fireEvent.change(minInput, { target: { value: '20' } });
      
      expect(mockProps.onFilterChange).toHaveBeenCalledWith({
        ...initialFilters,
        priceRange: [20, 200]
      });
    });

    it('calls onFilterChange when max price is changed', () => {
      render(<FilterSidebar {...mockProps} />);
      
      const maxInput = screen.getByPlaceholderText('Max');
      fireEvent.change(maxInput, { target: { value: '150' } });
      
      expect(mockProps.onFilterChange).toHaveBeenCalledWith({
        ...initialFilters,
        priceRange: [10, 150]
      });
    });

    it('displays price range labels', () => {
      render(<FilterSidebar {...mockProps} />);
      
      expect(screen.getByText('$10')).toBeInTheDocument();
      expect(screen.getByText('$200')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for color buttons', () => {
      render(<FilterSidebar {...mockProps} />);
      
      mockFilterOptions.availableColors.forEach(color => {
        const colorButton = screen.getByLabelText(`Filter by ${color.name}`);
        expect(colorButton).toHaveAttribute('aria-label', `Filter by ${color.name}`);
      });
    });

    it('has proper title attributes for color buttons', () => {
      render(<FilterSidebar {...mockProps} />);
      
      mockFilterOptions.availableColors.forEach(color => {
        const colorButton = screen.getByLabelText(`Filter by ${color.name}`);
        expect(colorButton).toHaveAttribute('title', color.name);
      });
    });
  });
});