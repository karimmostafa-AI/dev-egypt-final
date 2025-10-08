'use client';
import { cva, type VariantProps } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';
import { InputHTMLAttributes, forwardRef, CSSProperties } from 'react';

const editTextClasses = cva(
  'w-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
  {
    variants: {
      variant: {
        default: 'bg-input-background border-input-border',
        outlined: 'bg-transparent border-gray-400',
        filled: 'bg-gray-100 border-transparent',
        error: 'bg-white border-red-500 focus:ring-red-500',
      },
      size: {
        small: 'px-2 py-1 text-sm',
        medium: 'px-3 py-2 text-base',
        large: 'px-4 py-3 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'medium',
    },
  }
)

interface EditTextProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>, VariantProps<typeof editTextClasses> {
  // Required parameters with defaults
  fill_background_color?: string;
  border_border?: string;
  border_border_radius?: string;
  
  // Optional parameters
  placeholder?: string;
  text_font_size?: string;
  text_font_family?: string;
  text_font_weight?: string;
  text_line_height?: string;
  text_text_align?: string;
  text_color?: string;
  layout_width?: string;
  padding?: string;
  position?: string;
  layout_gap?: string;
  
  // Additional props
  label?: string;
  error?: string;
  helperText?: string;
}

const EditText = forwardRef<HTMLInputElement, EditTextProps>(({
  // Required parameters with defaults
  fill_background_color = "bg-input-background",
  border_border = "1px solid #dddddd",
  border_border_radius = "rounded-sm",
  
  // Optional parameters (no defaults)
  placeholder,
  text_font_size,
  text_font_family,
  text_font_weight,
  text_line_height,
  text_text_align,
  text_color,
  layout_width,
  padding,
  position,
  layout_gap,
  
  // Additional props
  label,
  error,
  helperText,
  
  // Standard React props
  variant,
  size,
  className,
  type = 'text',
  ...props
}, ref) => {
  // Safe validation for optional parameters
  const hasValidFontSize = text_font_size && typeof text_font_size === 'string' && text_font_size.trim() !== ''
  const hasValidFontFamily = text_font_family && typeof text_font_family === 'string' && text_font_family.trim() !== ''
  const hasValidFontWeight = text_font_weight && typeof text_font_weight === 'string' && text_font_weight.trim() !== ''
  const hasValidLineHeight = text_line_height && typeof text_line_height === 'string' && text_line_height.trim() !== ''
  const hasValidTextAlign = text_text_align && typeof text_text_align === 'string' && text_text_align.trim() !== ''
  const hasValidTextColor = text_color && typeof text_color === 'string' && text_color.trim() !== ''
  const hasValidWidth = layout_width && typeof layout_width === 'string' && layout_width.trim() !== ''
  const hasValidPadding = padding && typeof padding === 'string' && padding.trim() !== ''
  const hasValidPosition = position && typeof position === 'string' && position.trim() !== ''
  const hasValidGap = layout_gap && typeof layout_gap === 'string' && layout_gap.trim() !== ''

  const optionalClasses = [
    hasValidFontSize ? text_font_size : '',
    hasValidFontFamily && text_font_family.startsWith('font-') ? text_font_family : '',
    hasValidFontWeight ? text_font_weight : '',
    hasValidLineHeight ? text_line_height : '',
    hasValidTextAlign ? `text-${text_text_align}` : '',
    hasValidTextColor ? text_color : '',
    hasValidWidth ? `w-[${layout_width}]` : '',
    hasValidPadding ? `p-[${padding}]` : '',
    hasValidPosition ? position : '',
    hasValidGap ? `gap-[${layout_gap}]` : '',
  ].filter(Boolean).join(' ')

  // Build custom styles for non-Tailwind properties
  const customStyles: CSSProperties = {
    ...(hasValidFontFamily && !text_font_family.startsWith('font-') && { fontFamily: text_font_family }),
  }

  // Build Tailwind classes for styling
  const styleClasses = [
    fill_background_color,
    border_border ? 'border' : '',
    border_border_radius,
    optionalClasses,
  ].filter(Boolean).join(' ')

  // Determine variant based on error state
  const finalVariant = error ? 'error' : variant

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        placeholder={placeholder}
        style={customStyles}
        className={twMerge(
          editTextClasses({ variant: finalVariant, size }),
          styleClasses,
          className
        )}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined}
        {...props}
      />
      {error && (
        <p id={`${props.id}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${props.id}-helper`} className="mt-1 text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  )
})

EditText.displayName = 'EditText'

export default EditText