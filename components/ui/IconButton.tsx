'use client';
import { cva, type VariantProps } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';
import { ButtonHTMLAttributes } from 'react';
 import Image from'next/image';

const iconButtonClasses = cva(
  'inline-flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'bg-iconButton-background hover:bg-gray-800 focus:ring-gray-500',
        secondary: 'bg-gray-200 hover:bg-gray-300 focus:ring-gray-500',
        outline: 'border-2 border-gray-300 bg-transparent hover:bg-gray-50 focus:ring-gray-500',
      },
      size: {
        small: 'p-1',
        medium: 'p-2',
        large: 'p-3',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'medium',
    },
  }
)

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof iconButtonClasses> {
  // Required parameters with defaults
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
  fill_background_color?: string;
  border_border_radius?: string;
  
  // Optional parameters
  padding?: string;
  layout_width?: string;
  position?: string;
}

const IconButton = ({
  // Required parameters with defaults
  src = "/images/default-icon.svg",
  alt = "Icon",
  width = 24,
  height = 24,
  fill_background_color = "bg-iconButton-background",
  border_border_radius = "rounded-lg",
  
  // Optional parameters (no defaults)
  padding,
  layout_width,
  position,
  
  // Standard React props
  variant,
  size,
  disabled = false,
  className,
  onClick,
  type = 'button',
  ...props
}: IconButtonProps) => {
  // Safe validation for optional parameters
  const hasValidPadding = padding && typeof padding === 'string' && padding.trim() !== ''
  const hasValidWidth = layout_width && typeof layout_width === 'string' && layout_width.trim() !== ''
  const hasValidPosition = position && typeof position === 'string' && position.trim() !== ''

  const optionalClasses = [
    hasValidPadding ? `p-[${padding}]` : '',
    hasValidWidth ? `w-[${layout_width}]` : '',
    hasValidPosition ? position : '',
  ].filter(Boolean).join(' ')

  // Build Tailwind classes for styling
  const styleClasses = [
    fill_background_color,
    border_border_radius,
    optionalClasses,
  ].filter(Boolean).join(' ')

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) {
      event.preventDefault()
      return
    }
    
    if (typeof onClick === 'function') {
      onClick(event)
    }
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={handleClick}
      className={twMerge(
        iconButtonClasses({ variant, size }),
        styleClasses,
        className
      )}
      aria-disabled={disabled}
      {...props}
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`w-[${width}px] h-[${height}px]`}
      />
    </button>
  )
}

export default IconButton