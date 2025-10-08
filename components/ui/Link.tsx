'use client';
import { cva, type VariantProps } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';
import { AnchorHTMLAttributes, CSSProperties } from 'react';
 import NextLink from'next/link';

const linkClasses = cva(
  'inline-flex items-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
  {
    variants: {
      variant: {
        default: 'text-link-text hover:text-blue-600',
        primary: 'text-blue-600 hover:text-blue-800',
        secondary: 'text-link-textAlt hover:text-gray-600',
        underline: 'text-link-textAlt hover:text-gray-600 underline',
      },
      size: {
        small: 'text-xs',
        medium: 'text-sm',
        large: 'text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'medium',
    },
  }
)

interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'size'>, VariantProps<typeof linkClasses> {
  // Required parameters with defaults
  text?: string;
  text_font_size?: string;
  text_font_family?: string;
  text_font_weight?: string;
  text_line_height?: string;
  text_text_align?: string;
  text_color?: string;
  text_decoration_line?: string;
  
  // Optional parameters
  layout_width?: string;
  position?: string;
  
  // Link specific props
  href?: string;
  external?: boolean;
}

const Link = ({
  // Required parameters with defaults
  text = "Link",
  text_font_size = "text-base",
  text_font_family = "Roboto",
  text_font_weight = "font-normal",
  text_line_height = "leading-sm",
  text_text_align = "left",
  text_color = "text-link-textAlt",
  text_decoration_line,
  
  // Optional parameters (no defaults)
  layout_width,
  position,
  
  // Link specific props
  href = "#",
  external = false,
  
  // Standard React props
  variant,
  size,
  className,
  children,
  ...props
}: LinkProps) => {
  // Safe validation for optional parameters
  const hasValidWidth = layout_width && typeof layout_width === 'string' && layout_width.trim() !== ''
  const hasValidPosition = position && typeof position === 'string' && position.trim() !== ''
  const hasValidDecoration = text_decoration_line && typeof text_decoration_line === 'string' && text_decoration_line.trim() !== ''

  const optionalClasses = [
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
    hasValidDecoration && text_decoration_line.includes('underline') ? 'underline' : '',
    hasValidDecoration && text_decoration_line.includes('line-through') ? 'line-through' : '',
    optionalClasses,
  ].filter(Boolean).join(' ')

  const content = children || text

  if (external || href.startsWith('http')) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={customStyles}
        className={twMerge(
          linkClasses({ variant, size }),
          textClasses,
          className
        )}
        {...props}
      >
        {content}
      </a>
    )
  }

  return (
    <NextLink
      href={href}
      style={customStyles}
      className={twMerge(
        linkClasses({ variant, size }),
        textClasses,
        className
      )}
      {...props}
    >
      {content}
    </NextLink>
  )
}

export default Link