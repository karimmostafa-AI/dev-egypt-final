import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CategoryHeader from '../CategoryHeader';
import { BreadcrumbItem } from '@/types/product-catalog';

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('CategoryHeader', () => {
  const mockBreadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Clothing', href: '/clothing' },
    { label: 'Scrubs', href: '/clothing/scrubs' },
  ];

  it('renders category title correctly', () => {
    render(
      <CategoryHeader
        category="scrubs"
        productCount={25}
        breadcrumbs={mockBreadcrumbs}
      />
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('scrubs');
  });

  it('displays product count correctly for multiple products', () => {
    render(
      <CategoryHeader
        category="scrubs"
        productCount={25}
        breadcrumbs={mockBreadcrumbs}
      />
    );

    expect(screen.getByText('25 products')).toBeInTheDocument();
  });

  it('displays product count correctly for single product', () => {
    render(
      <CategoryHeader
        category="scrubs"
        productCount={1}
        breadcrumbs={mockBreadcrumbs}
      />
    );

    expect(screen.getByText('1 product')).toBeInTheDocument();
  });

  it('displays product count correctly for zero products', () => {
    render(
      <CategoryHeader
        category="scrubs"
        productCount={0}
        breadcrumbs={mockBreadcrumbs}
      />
    );

    expect(screen.getByText('0 products')).toBeInTheDocument();
  });

  it('renders breadcrumb navigation', () => {
    render(
      <CategoryHeader
        category="scrubs"
        productCount={25}
        breadcrumbs={mockBreadcrumbs}
      />
    );

    // Check that breadcrumb navigation is present
    expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument();
    
    // Check that all breadcrumb items are rendered
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Clothing')).toBeInTheDocument();
    expect(screen.getByText('Scrubs')).toBeInTheDocument();
  });

  it('capitalizes category name in title', () => {
    render(
      <CategoryHeader
        category="medical scrubs"
        productCount={10}
        breadcrumbs={mockBreadcrumbs}
      />
    );

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveClass('capitalize');
    expect(heading).toHaveTextContent('medical scrubs');
  });

  it('updates product count dynamically', () => {
    const { rerender } = render(
      <CategoryHeader
        category="scrubs"
        productCount={25}
        breadcrumbs={mockBreadcrumbs}
      />
    );

    expect(screen.getByText('25 products')).toBeInTheDocument();

    // Simulate filter application that reduces product count
    rerender(
      <CategoryHeader
        category="scrubs"
        productCount={8}
        breadcrumbs={mockBreadcrumbs}
      />
    );

    expect(screen.getByText('8 products')).toBeInTheDocument();
    expect(screen.queryByText('25 products')).not.toBeInTheDocument();
  });

  it('handles empty breadcrumbs array', () => {
    render(
      <CategoryHeader
        category="scrubs"
        productCount={25}
        breadcrumbs={[]}
      />
    );

    // Should still render the component without errors
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('scrubs');
    expect(screen.getByText('25 products')).toBeInTheDocument();
  });

  it('applies correct CSS classes for styling', () => {
    const { container } = render(
      <CategoryHeader
        category="scrubs"
        productCount={25}
        breadcrumbs={mockBreadcrumbs}
      />
    );

    // Find the main container div with the background and border classes
    const mainContainer = container.querySelector('.bg-white.border-b.border-gray-200');
    expect(mainContainer).toBeInTheDocument();
    
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveClass('text-2xl', 'font-bold', 'text-gray-900', 'capitalize');
  });

  it('renders with proper semantic structure', () => {
    render(
      <CategoryHeader
        category="scrubs"
        productCount={25}
        breadcrumbs={mockBreadcrumbs}
      />
    );

    // Check for proper heading hierarchy
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    
    // Check for navigation landmark
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });
});