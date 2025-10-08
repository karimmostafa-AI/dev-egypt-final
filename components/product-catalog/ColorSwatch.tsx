'use client';

import { useState, memo, useCallback, useMemo, useRef, useEffect } from 'react';
import { twMerge } from 'tailwind-merge';
import type { ColorSwatchProps } from '@/types/product-catalog';
import { KeyboardNavigation, generateId, AriaHelpers, ScreenReaderAnnouncer } from '@/utils/accessibility';

const ColorSwatch = memo(({
  colors,
  selectedColor,
  onColorSelect,
  maxVisible = 8,
  ariaLabelledBy,
}: ColorSwatchProps & { ariaLabelledBy?: string }) => {
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const announcer = ScreenReaderAnnouncer.getInstance();
  const [groupId] = useState(generateId('color-swatch-group'));

  // Memoize expensive calculations
  const { visibleColors, remainingCount } = useMemo(() => ({
    visibleColors: colors.slice(0, maxVisible),
    remainingCount: Math.max(0, colors.length - maxVisible)
  }), [colors, maxVisible]);

  const handleColorClick = useCallback((colorName: string) => {
    onColorSelect(colorName);
    announcer.announce(`Selected ${colorName} color`, 'polite');
  }, [onColorSelect, announcer]);

  const handleMouseEnter = useCallback((colorName: string) => {
    setHoveredColor(colorName);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredColor(null);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent, colorIndex: number) => {
    const handled = KeyboardNavigation.handleListNavigation(
      event.nativeEvent,
      colorIndex,
      visibleColors.length,
      (newIndex) => {
        setFocusedIndex(newIndex);
        buttonRefs.current[newIndex]?.focus();
      }
    );

    if (!handled && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      handleColorClick(visibleColors[colorIndex].name);
    }
  }, [visibleColors, handleColorClick]);

  // Update button refs when colors change
  useEffect(() => {
    buttonRefs.current = buttonRefs.current.slice(0, visibleColors.length);
  }, [visibleColors.length]);

  if (colors.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <div 
        className="flex gap-1 relative"
        role="group"
        aria-label="Color options"
        aria-labelledby={ariaLabelledBy}
        id={groupId}
      >
        {visibleColors.map((color, index) => {
          const isSelected = selectedColor === color.name;
          const isHovered = hoveredColor === color.name;
          
          return (
            <div key={color.name} className="relative">
              <button
                ref={(el) => {
                  buttonRefs.current[index] = el;
                }}
                onClick={() => handleColorClick(color.name)}
                onMouseEnter={() => handleMouseEnter(color.name)}
                onMouseLeave={handleMouseLeave}
                onFocus={() => setFocusedIndex(index)}
                onBlur={() => setFocusedIndex(-1)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className={twMerge(
                  'w-5 h-5 rounded-full border-2 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
                  isSelected
                    ? 'border-gray-900 scale-110 shadow-md'
                    : 'border-gray-300 hover:border-gray-500'
                )}
                style={{ backgroundColor: color.hex }}
                aria-label={`${isSelected ? 'Currently selected' : 'Select'} ${color.name} color`}
                title={color.name}
                tabIndex={index === 0 ? 0 : -1}
                {...AriaHelpers.selection(isSelected)}
              />
              
              {/* Tooltip */}
              {isHovered && (
                <div 
                  className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-10"
                  role="tooltip"
                  aria-hidden="true"
                >
                  <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {color.name}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        {/* "+X more" indicator */}
        {remainingCount > 0 && (
          <div className="flex items-center ml-1" aria-hidden="true">
            <span className="text-xs text-gray-500 font-medium">
              +{remainingCount} more
            </span>
          </div>
        )}
      </div>
      
      {/* Screen reader only color list */}
      <div className="sr-only">
        Available colors: {colors.map(c => c.name).join(', ')}
        {selectedColor && `. Currently selected: ${selectedColor}`}
      </div>
    </div>
  );
});

ColorSwatch.displayName = 'ColorSwatch';

export default ColorSwatch;