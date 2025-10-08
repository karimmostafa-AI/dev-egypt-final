'use client';
import { cva, type VariantProps } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';
import { InputHTMLAttributes, useState, CSSProperties } from 'react';

const searchClasses = cva(
  'flex items-center border transition-all duration-200 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500',
  {
    variants: {
      variant: {
        default: 'bg-search-background border-gray-300',
        outlined: 'bg-transparent border-gray-400',
        filled: 'bg-gray-100 border-transparent',
      },
      size: {
        small: 'px-2 py-1',
        medium: 'px-3 py-2',
        large: 'px-4 py-3',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'medium',
    },
  }
)

interface SearchViewProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>, VariantProps<typeof searchClasses> {
  // Required parameters with defaults
  placeholder?: string;
  text_font_size?: string;
  text_font_family?: string;
  text_font_weight?: string;
  text_line_height?: string;
  text_text_align?: string;
  text_color?: string;
  fill_background_color?: string;
  
  // Optional parameters
  layout_gap?: string;
  layout_width?: string;
  padding?: string;
  margin?: string;
  position?: string;
  
  // Search specific props
  onSearch?: (value: string) => void;
  showSearchIcon?: boolean;
}

const SearchView = ({
  // Required parameters with defaults
  placeholder = "Search (keywords,etc)",
  text_font_size = "text-lg",
  text_font_family = "Roboto",
  text_font_weight = "font-light",
  text_line_height = "leading-md",
  text_text_align = "left",
  text_color = "text-search-text",
  fill_background_color = "bg-search-background",
  
  // Optional parameters (no defaults)
  layout_gap,
  layout_width,
  padding,
  margin,
  position,
  
  // Search specific props
  onSearch,
  showSearchIcon = true,
  
  // Standard React props
  variant,
  size,
  className,
  onChange,
  onKeyDown,
  ...props
}: SearchViewProps) => {
  const [searchValue, setSearchValue] = useState('')

  // Safe validation for optional parameters
  const hasValidGap = layout_gap && typeof layout_gap === 'string' && layout_gap.trim() !== ''
  const hasValidWidth = layout_width && typeof layout_width === 'string' && layout_width.trim() !== ''
  const hasValidPadding = padding && typeof padding === 'string' && padding.trim() !== ''
  const hasValidMargin = margin && typeof margin === 'string' && margin.trim() !== ''
  const hasValidPosition = position && typeof position === 'string' && position.trim() !== ''

  const optionalClasses = [
    hasValidGap ? `gap-[${layout_gap}]` : '',
    hasValidWidth ? `w-[${layout_width}]` : 'w-full',
    hasValidPadding ? `p-[${padding}]` : '',
    hasValidMargin ? `m-[${margin}]` : '',
    hasValidPosition ? position : '',
  ].filter(Boolean).join(' ')

  // Build custom styles for non-Tailwind properties
  const customStyles: CSSProperties = {
    ...(text_font_family && !text_font_family.startsWith('font-') && { fontFamily: text_font_family }),
  }

  // Build Tailwind classes for styling
  const containerClasses = [
    fill_background_color,
    optionalClasses,
  ].filter(Boolean).join(' ')

  const inputClasses = [
    'flex-1 outline-none bg-transparent',
    text_font_size,
    text_font_family.startsWith('font-') ? text_font_family : '',
    text_font_weight,
    text_line_height,
    `text-${text_text_align}`,
    text_color,
  ].filter(Boolean).join(' ')

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setSearchValue(value)
    
    if (typeof onChange === 'function') {
      onChange(event)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && typeof onSearch === 'function') {
      onSearch(searchValue)
    }
    
    if (typeof onKeyDown === 'function') {
      onKeyDown(event)
    }
  }

  const handleSearchClick = () => {
    if (typeof onSearch === 'function') {
      onSearch(searchValue)
    }
  }

  return (
    <div className={twMerge(searchClasses({ variant, size }), containerClasses, className)}>
      {showSearchIcon && (
        <button
          type="button"
          onClick={handleSearchClick}
          className="flex items-center justify-center p-1 hover:bg-gray-100 rounded transition-colors"
          aria-label="Search"
        >
          <svg
            className="w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      )}
      <input
        type="text"
        placeholder={placeholder}
        value={searchValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        style={customStyles}
        className={inputClasses}
        {...props}
      />
    </div>
  )
}

export default SearchView