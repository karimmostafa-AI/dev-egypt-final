import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ProductGridSkeleton from '../ProductGridSkeleton';

describe('ProductGridSkeleton', () => {
  it('renders with default count of 12 skeleton cards', () => {
    const { container } = render(<ProductGridSkeleton />);
    
    expect(screen.getByRole('status', { name: 'Loading products' })).toBeInTheDocument();
    
    // Count the skeleton cards by looking for animate-pulse elements
    const skeletonCards = container.querySelectorAll('.animate-pulse');
    expect(skeletonCards).toHaveLength(12);
  });

  it('renders with custom count of skeleton cards', () => {
    const { container } = render(<ProductGridSkeleton count={6} />);
    
    const skeletonCards = container.querySelectorAll('.animate-pulse');
    expect(skeletonCards).toHaveLength(6);
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <ProductGridSkeleton className="custom-skeleton-class" />
    );
    
    const skeletonGrid = container.querySelector('.custom-skeleton-class');
    expect(skeletonGrid).toBeInTheDocument();
  });

  it('has proper responsive grid classes', () => {
    render(<ProductGridSkeleton />);
    
    const gridElement = screen.getByRole('status');
    expect(gridElement).toHaveClass('grid-cols-1'); // Mobile
    expect(gridElement).toHaveClass('sm:grid-cols-2'); // Small screens
    expect(gridElement).toHaveClass('lg:grid-cols-3'); // Large screens
    expect(gridElement).toHaveClass('xl:grid-cols-4'); // Extra large
    expect(gridElement).toHaveClass('2xl:grid-cols-5'); // 2XL
  });

  it('has proper spacing and padding classes', () => {
    render(<ProductGridSkeleton />);
    
    const gridElement = screen.getByRole('status');
    expect(gridElement).toHaveClass('gap-6'); // Grid gap
    expect(gridElement).toHaveClass('p-4'); // Mobile padding
    expect(gridElement).toHaveClass('sm:p-6'); // Desktop padding
  });

  it('renders skeleton elements with proper structure', () => {
    const { container } = render(<ProductGridSkeleton count={1} />);
    
    const skeletonCard = container.querySelector('.animate-pulse');
    expect(skeletonCard).toBeInTheDocument();
    
    // Check for image skeleton
    const imageSkeleton = container.querySelector('.aspect-square.bg-gray-200');
    expect(imageSkeleton).toBeInTheDocument();
    
    // Check for content skeleton elements
    const contentSkeletons = container.querySelectorAll('.bg-gray-200.rounded');
    expect(contentSkeletons.length).toBeGreaterThan(5); // Should have multiple skeleton elements
  });

  it('renders with zero count', () => {
    const { container } = render(<ProductGridSkeleton count={0} />);
    
    expect(screen.getByRole('status', { name: 'Loading products' })).toBeInTheDocument();
    
    const skeletonCards = container.querySelectorAll('.animate-pulse');
    expect(skeletonCards).toHaveLength(0);
  });

  it('has proper accessibility attributes', () => {
    render(<ProductGridSkeleton />);
    
    const gridElement = screen.getByRole('status', { name: 'Loading products' });
    expect(gridElement).toBeInTheDocument();
  });

  it('skeleton cards have proper structure for all elements', () => {
    const { container } = render(<ProductGridSkeleton count={1} />);
    
    // Check for brand skeleton
    const brandSkeleton = container.querySelector('.h-4.bg-gray-200.rounded.w-20');
    expect(brandSkeleton).toBeInTheDocument();
    
    // Check for price skeleton
    const priceSkeleton = container.querySelector('.h-6.bg-gray-200.rounded.w-24');
    expect(priceSkeleton).toBeInTheDocument();
    
    // Check for rating stars skeleton
    const ratingStars = container.querySelectorAll('.w-4.h-4.bg-gray-200.rounded');
    expect(ratingStars.length).toBeGreaterThanOrEqual(5);
    
    // Check for color swatches skeleton
    const colorSwatches = container.querySelectorAll('.w-5.h-5.bg-gray-200.rounded-full');
    expect(colorSwatches.length).toBeGreaterThanOrEqual(4);
    
    // Check for action buttons skeleton
    const actionButtons = container.querySelectorAll('.h-10.bg-gray-200.rounded');
    expect(actionButtons.length).toBeGreaterThanOrEqual(2);
  });
});