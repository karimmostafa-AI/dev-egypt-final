import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ColorSwatch from '../ColorSwatch';
import type { ColorOption } from '@/types/product-catalog';

const mockColors: ColorOption[] = [
  { name: 'Red', hex: '#FF0000', imageUrl: '/red.jpg' },
  { name: 'Blue', hex: '#0000FF', imageUrl: '/blue.jpg' },
  { name: 'Green', hex: '#00FF00', imageUrl: '/green.jpg' },
  { name: 'Yellow', hex: '#FFFF00', imageUrl: '/yellow.jpg' },
  { name: 'Purple', hex: '#800080', imageUrl: '/purple.jpg' },
];

const manyColors: ColorOption[] = [
  ...mockColors,
  { name: 'Orange', hex: '#FFA500', imageUrl: '/orange.jpg' },
  { name: 'Pink', hex: '#FFC0CB', imageUrl: '/pink.jpg' },
  { name: 'Brown', hex: '#A52A2A', imageUrl: '/brown.jpg' },
  { name: 'Black', hex: '#000000', imageUrl: '/black.jpg' },
  { name: 'White', hex: '#FFFFFF', imageUrl: '/white.jpg' },
  { name: 'Gray', hex: '#808080', imageUrl: '/gray.jpg' },
];

describe('ColorSwatch', () => {
  const mockOnColorSelect = vi.fn();

  beforeEach(() => {
    mockOnColorSelect.mockClear();
  });

  it('renders nothing when no colors are provided', () => {
    const { container } = render(
      <ColorSwatch
        colors={[]}
        onColorSelect={mockOnColorSelect}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders color swatches for provided colors', () => {
    render(
      <ColorSwatch
        colors={mockColors}
        onColorSelect={mockOnColorSelect}
      />
    );

    mockColors.forEach(color => {
      const swatch = screen.getByLabelText(`Select ${color.name} color`);
      expect(swatch).toBeInTheDocument();
      expect(swatch).toHaveStyle(`background-color: ${color.hex}`);
    });
  });

  it('applies selected styling to the selected color', () => {
    render(
      <ColorSwatch
        colors={mockColors}
        selectedColor="Red"
        onColorSelect={mockOnColorSelect}
      />
    );

    const redSwatch = screen.getByLabelText('Select Red color');
    expect(redSwatch).toHaveClass('border-gray-900', 'scale-110');
  });

  it('calls onColorSelect when a color swatch is clicked', () => {
    render(
      <ColorSwatch
        colors={mockColors}
        onColorSelect={mockOnColorSelect}
      />
    );

    const blueSwatch = screen.getByLabelText('Select Blue color');
    fireEvent.click(blueSwatch);

    expect(mockOnColorSelect).toHaveBeenCalledWith('Blue');
  });

  it('shows tooltip on hover', async () => {
    render(
      <ColorSwatch
        colors={mockColors}
        onColorSelect={mockOnColorSelect}
      />
    );

    const redSwatch = screen.getByLabelText('Select Red color');
    fireEvent.mouseEnter(redSwatch);

    await waitFor(() => {
      expect(screen.getByText('Red')).toBeInTheDocument();
    });
  });

  it('hides tooltip on mouse leave', async () => {
    render(
      <ColorSwatch
        colors={mockColors}
        onColorSelect={mockOnColorSelect}
      />
    );

    const redSwatch = screen.getByLabelText('Select Red color');
    fireEvent.mouseEnter(redSwatch);

    await waitFor(() => {
      expect(screen.getByText('Red')).toBeInTheDocument();
    });

    fireEvent.mouseLeave(redSwatch);

    await waitFor(() => {
      expect(screen.queryByText('Red')).not.toBeInTheDocument();
    });
  });

  it('limits visible colors to maxVisible prop', () => {
    render(
      <ColorSwatch
        colors={manyColors}
        onColorSelect={mockOnColorSelect}
        maxVisible={5}
      />
    );

    // Should show first 5 colors
    expect(screen.getByLabelText('Select Red color')).toBeInTheDocument();
    expect(screen.getByLabelText('Select Blue color')).toBeInTheDocument();
    expect(screen.getByLabelText('Select Green color')).toBeInTheDocument();
    expect(screen.getByLabelText('Select Yellow color')).toBeInTheDocument();
    expect(screen.getByLabelText('Select Purple color')).toBeInTheDocument();

    // Should not show 6th color and beyond
    expect(screen.queryByLabelText('Select Orange color')).not.toBeInTheDocument();
  });

  it('shows "+X more" indicator when there are more colors than maxVisible', () => {
    render(
      <ColorSwatch
        colors={manyColors}
        onColorSelect={mockOnColorSelect}
        maxVisible={8}
      />
    );

    const remainingCount = manyColors.length - 8;
    expect(screen.getByText(`+${remainingCount} more`)).toBeInTheDocument();
  });

  it('does not show "+X more" indicator when all colors are visible', () => {
    render(
      <ColorSwatch
        colors={mockColors}
        onColorSelect={mockOnColorSelect}
        maxVisible={8}
      />
    );

    expect(screen.queryByText(/\+\d+ more/)).not.toBeInTheDocument();
  });

  it('uses default maxVisible of 8 when not specified', () => {
    render(
      <ColorSwatch
        colors={manyColors}
        onColorSelect={mockOnColorSelect}
      />
    );

    // Should show first 8 colors
    const visibleColors = manyColors.slice(0, 8);
    visibleColors.forEach(color => {
      expect(screen.getByLabelText(`Select ${color.name} color`)).toBeInTheDocument();
    });

    // Should show "+X more" for remaining colors
    const remainingCount = manyColors.length - 8;
    expect(screen.getByText(`+${remainingCount} more`)).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(
      <ColorSwatch
        colors={mockColors}
        onColorSelect={mockOnColorSelect}
      />
    );

    mockColors.forEach(color => {
      const swatch = screen.getByLabelText(`Select ${color.name} color`);
      expect(swatch).toHaveAttribute('aria-label', `Select ${color.name} color`);
      expect(swatch).toHaveAttribute('title', color.name);
    });
  });

  it('applies hover effects correctly', () => {
    render(
      <ColorSwatch
        colors={mockColors}
        onColorSelect={mockOnColorSelect}
      />
    );

    const redSwatch = screen.getByLabelText('Select Red color');
    expect(redSwatch).toHaveClass('hover:scale-110');
  });

  it('handles keyboard focus properly', () => {
    render(
      <ColorSwatch
        colors={mockColors}
        onColorSelect={mockOnColorSelect}
      />
    );

    const redSwatch = screen.getByLabelText('Select Red color');
    expect(redSwatch).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-offset-2', 'focus:ring-gray-500');
  });

  it('maintains tooltip state independently for each color', async () => {
    render(
      <ColorSwatch
        colors={mockColors}
        onColorSelect={mockOnColorSelect}
      />
    );

    const redSwatch = screen.getByLabelText('Select Red color');
    const blueSwatch = screen.getByLabelText('Select Blue color');

    // Hover over red
    fireEvent.mouseEnter(redSwatch);
    await waitFor(() => {
      expect(screen.getByText('Red')).toBeInTheDocument();
    });

    // Hover over blue (should hide red tooltip and show blue)
    fireEvent.mouseEnter(blueSwatch);
    await waitFor(() => {
      expect(screen.queryByText('Red')).not.toBeInTheDocument();
      expect(screen.getByText('Blue')).toBeInTheDocument();
    });
  });

  it('handles edge case with single color', () => {
    const singleColor = [mockColors[0]];
    render(
      <ColorSwatch
        colors={singleColor}
        selectedColor="Red"
        onColorSelect={mockOnColorSelect}
      />
    );

    expect(screen.getByLabelText('Select Red color')).toBeInTheDocument();
    expect(screen.queryByText(/\+\d+ more/)).not.toBeInTheDocument();
  });

  it('handles color selection with special characters in color names', () => {
    const specialColors: ColorOption[] = [
      { name: 'Navy Blue', hex: '#000080', imageUrl: '/navy.jpg' },
      { name: 'Forest Green', hex: '#228B22', imageUrl: '/forest.jpg' },
      { name: 'Hot Pink', hex: '#FF69B4', imageUrl: '/hotpink.jpg' },
    ];

    render(
      <ColorSwatch
        colors={specialColors}
        onColorSelect={mockOnColorSelect}
      />
    );

    const navySwatch = screen.getByLabelText('Select Navy Blue color');
    fireEvent.click(navySwatch);

    expect(mockOnColorSelect).toHaveBeenCalledWith('Navy Blue');
  });
});