'use client';

import Link from 'next/link';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const breadcrumbVariants = cva(
  'flex items-center space-x-1 text-sm',
  {
    variants: {
      variant: {
        default: 'text-gray-600',
        dark: 'text-gray-800',
        light: 'text-gray-400',
      },
      size: {
        small: 'text-xs',
        default: 'text-sm',
        large: 'text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

interface BreadcrumbItem {
  label: string;
  href: string;
  isActive?: boolean;
}

interface BreadCrumbProps extends VariantProps<typeof breadcrumbVariants> {
  items: BreadcrumbItem[];
  separator?: string;
  className?: string;
}

const BreadCrumb = ({ 
  items, 
  separator = '/', 
  variant, 
  size, 
  className 
}: BreadCrumbProps) => {
  return (
    <nav 
      aria-label="Breadcrumb" 
      className={cn(breadcrumbVariants({ variant, size }), className)}
    >
      <ol className="flex items-center space-x-1">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <span 
                className="mx-2 text-gray-400" 
                aria-hidden="true"
              >
                {separator}
              </span>
            )}
            {item.isActive ? (
              <span 
                className="font-medium text-gray-900" 
                aria-current="page"
              >
                {item.label}
              </span>
            ) : (
              <Link 
                href={item.href}
                className="hover:text-gray-900 transition-colors"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default BreadCrumb;