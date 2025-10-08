'use client';
import { useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { CSSProperties } from 'react';

interface DropdownProps {
  // Required parameters with defaults
  placeholder?: string;
  text_font_size?: string;
  text_font_family?: string;
  text_font_weight?: string;
  text_line_height?: string;
  text_text_align?: string;
  text_color?: string;
  fill_background_color?: string;
  border_border?: string;
  border_border_radius?: string;
  text_text_transform?: string;
  border_border_top?: string;
  border_border_bottom?: string;
  
  // Optional parameters
  layout_gap?: string;
  layout_width?: string;
  padding?: string;
  margin?: string;
  position?: string;
  
  // Dropdown specific props
  options?: string[];
  onSelect?: (value: string) => void;
  className?: string;
}

const Dropdown = ({
  // Required parameters with defaults
  placeholder = "Royal",
  text_font_size = "text-2xl",
  text_font_family = "Roboto",
  text_font_weight = "font-normal",
  text_line_height = "leading-2xl",
  text_text_align = "left",
  text_color = "text-neutral-dark",
  fill_background_color = "bg-neutral-light",
  border_border = "1px solid #dddddd",
  border_border_radius = "rounded-base",
  text_text_transform,
  border_border_top,
  border_border_bottom,
  
  // Optional parameters (no defaults)
  layout_gap,
  layout_width,
  padding,
  margin,
  position,
  
  // Dropdown specific props
  options = ['Royal', 'Navy', 'Black', 'White', 'Gray'],
  onSelect,
  className,
}: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedValue, setSelectedValue] = useState('')

  // Safe validation for optional parameters
  const hasValidGap = layout_gap && typeof layout_gap === 'string' && layout_gap.trim() !== ''
  const hasValidWidth = layout_width && typeof layout_width === 'string' && layout_width.trim() !== ''
  const hasValidPadding = padding && typeof padding === 'string' && padding.trim() !== ''
  const hasValidMargin = margin && typeof margin === 'string' && margin.trim() !== ''
  const hasValidPosition = position && typeof position === 'string' && position.trim() !== ''

  const optionalClasses = [
    hasValidGap ? `gap-[${layout_gap}]` : '',
    hasValidWidth ? `w-[${layout_width}]` : '',
    hasValidPadding ? `p-[${padding}]` : '',
    hasValidMargin ? `m-[${margin}]` : '',
    hasValidPosition ? position : '',
  ].filter(Boolean).join(' ')

  // Build custom styles for non-Tailwind properties
  const customStyles: CSSProperties = {
    ...(text_font_family && !text_font_family.startsWith('font-') && { fontFamily: text_font_family }),
  }

  // Build Tailwind classes for styling
  const styleClasses = [
    text_font_size,
    text_font_family.startsWith('font-') ? text_font_family : '',
    text_font_weight,
    text_line_height,
    `text-${text_text_align}`,
    text_color,
    fill_background_color,
    border_border_radius,
    text_text_transform ? `${text_text_transform}` : '',
    border_border_top ? `border-t-[${border_border_top}]` : '',
    border_border_bottom ? `border-b-[${border_border_bottom}]` : '',
    'border border-border-primary',
    'px-3 py-2',
    'cursor-pointer',
    'transition-all duration-200',
  ].filter(Boolean).join(' ')

  const handleSelect = (value: string) => {
    setSelectedValue(value)
    setIsOpen(false)
    if (onSelect) {
      onSelect(value)
    }
  }

  return (
    <div className="relative">
      <div
        style={customStyles}
        className={twMerge(
          styleClasses,
          optionalClasses,
          'flex items-center justify-between',
          className
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedValue ? text_color : 'text-text-muted'}>
          {selectedValue || placeholder}
        </span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-border-primary rounded-base shadow-lg max-h-60 overflow-auto">
          {options.map((option, index) => (
            <div
              key={index}
              className="px-3 py-2 hover:bg-neutral-light cursor-pointer transition-colors duration-200"
              onClick={() => handleSelect(option)}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Dropdown