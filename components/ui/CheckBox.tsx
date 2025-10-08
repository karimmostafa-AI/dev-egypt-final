'use client';
import { cva, type VariantProps } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';
import { InputHTMLAttributes, forwardRef, CSSProperties } from 'react';

const checkboxClasses = cva(
  'flex items-center cursor-pointer',
  {
    variants: {
      variant: {
        default: '',
        primary: '',
        secondary: '',
      },
      size: {
        small: 'text-sm',
        medium: 'text-base',
        large: 'text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'medium',
    },
  }
)

const checkboxInputClasses = cva(
  'rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2 focus:ring-offset-2 transition-all duration-200',
  {
    variants: {
      size: {
        small: 'h-3 w-3',
        medium: 'h-4 w-4',
        large: 'h-5 w-5',
      },
    },
    defaultVariants: {
      size: 'medium',
    },
  }
)

interface CheckBoxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>, VariantProps<typeof checkboxClasses> {
  // Required parameters with defaults
  text?: string;
  text_font_size?: string;
  text_font_family?: string;
  text_font_weight?: string;
  text_line_height?: string;
  text_text_align?: string;
  text_color?: string;
  
  // Optional parameters
  layout_gap?: string;
  layout_width?: string;
  position?: string;
  
  // Additional props
  label?: string;
  error?: string;
}

const CheckBox = forwardRef<HTMLInputElement, CheckBoxProps>(({
  // Required parameters with defaults
  text = "Remember Me",
  text_font_size = "text-lg",
  text_font_family = "Roboto",
  text_font_weight = "font-normal",
  text_line_height = "leading-md",
  text_text_align = "left",
  text_color = "text-checkbox-text",
  
  // Optional parameters (no defaults)
  layout_gap,
  layout_width,
  position,
  
  // Additional props
  label,
  error,
  
  // Standard React props
  variant,
  size,
  className,
  ...props
}, ref) => {
  // Safe validation for optional parameters
  const hasValidGap = layout_gap && typeof layout_gap === 'string' && layout_gap.trim() !== ''
  const hasValidWidth = layout_width && typeof layout_width === 'string' && layout_width.trim() !== ''
  const hasValidPosition = position && typeof position === 'string' && position.trim() !== ''

  const optionalClasses = [
    hasValidGap ? `gap-[${layout_gap}]` : 'gap-2',
    hasValidWidth ? `w-[${layout_width}]` : '',
    hasValidPosition ? position : '',
  ].filter(Boolean).join(' ')

  // Build custom styles for non-Tailwind properties
  const customStyles: CSSProperties = {
    ...(text_font_family && !text_font_family.startsWith('font-') && { fontFamily: text_font_family }),
  }

  // Build Tailwind classes for text styling
  const textClasses = [
    text_font_size,
    text_font_family.startsWith('font-') ? text_font_family : '',
    text_font_weight,
    text_line_height,
    `text-${text_text_align}`,
    text_color,
  ].filter(Boolean).join(' ')

  const displayText = label || text

  return (
    <div className="w-full">
      <label 
        className={twMerge(
          checkboxClasses({ variant, size }),
          optionalClasses,
          className
        )}
        style={customStyles}
      >
        <input
          ref={ref}
          type="checkbox"
          className={checkboxInputClasses({ size })}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${props.id}-error` : undefined}
          {...props}
        />
        {displayText && (
          <span className={twMerge('ml-2 select-none', textClasses)}>
            {displayText}
          </span>
        )}
      </label>
      {error && (
        <p id={`${props.id}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
})

CheckBox.displayName = 'CheckBox'

export default CheckBox