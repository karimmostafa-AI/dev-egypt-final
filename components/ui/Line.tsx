'use client';
import { cva, type VariantProps } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';
import { HTMLAttributes } from 'react';

const lineClasses = cva(
  'block',
  {
    variants: {
      orientation: {
        horizontal: 'w-full h-px',
        vertical: 'w-px h-full',
      },
      variant: {
        default: 'bg-line-background',
        primary: 'bg-gray-300',
        secondary: 'bg-gray-200',
      },
    },
    defaultVariants: {
      orientation: 'horizontal',
      variant: 'default',
    },
  }
)

interface LineProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof lineClasses> {
  // Required parameters with defaults
  fill_background_color?: string;
  
  // Optional parameters
  width?: string;
  height?: string;
  layout_width?: string;
  position?: string;
  
  // Line specific props
  orientation?: 'horizontal' | 'vertical';
}

const Line = ({
  // Required parameters with defaults
  fill_background_color = "bg-line-background",
  
  // Optional parameters (no defaults)
  width,
  height,
  layout_width,
  position,
  
  // Line specific props
  orientation,
  
  // Standard React props
  variant,
  className,
  ...props
}: LineProps) => {
  // Safe validation for optional parameters
  const hasValidWidth = width && typeof width === 'string' && width.trim() !== ''
  const hasValidHeight = height && typeof height === 'string' && height.trim() !== ''
  const hasValidLayoutWidth = layout_width && typeof layout_width === 'string' && layout_width.trim() !== ''
  const hasValidPosition = position && typeof position === 'string' && position.trim() !== ''

  // Determine orientation based on dimensions if not explicitly set
  let finalOrientation = orientation
  if (!finalOrientation && hasValidWidth && hasValidHeight) {
    const widthNum = parseInt(width)
    const heightNum = parseInt(height)
    finalOrientation = widthNum > heightNum ? 'horizontal' : 'vertical'
  }

  const optionalClasses = [
    hasValidWidth ? `w-[${width}]` : '',
    hasValidHeight ? `h-[${height}]` : '',
    hasValidLayoutWidth ? `w-[${layout_width}]` : '',
    hasValidPosition ? position : '',
  ].filter(Boolean).join(' ')

  // Build Tailwind classes for styling
  const styleClasses = [
    fill_background_color,
    optionalClasses,
  ].filter(Boolean).join(' ')

  return (
    <div
      className={twMerge(
        lineClasses({ orientation: finalOrientation, variant }),
        styleClasses,
        className
      )}
      role="separator"
      {...props}
    />
  )
}

export default Line