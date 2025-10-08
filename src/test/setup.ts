import '@testing-library/jest-dom'
import { vi } from 'vitest'
import React from 'react'

// Mock Next.js Image component
vi.mock('next/image', () => ({
  __esModule: true,
  default: React.forwardRef<HTMLImageElement, any>((props, ref) => {
    const { src, alt, fill, sizes, onError, className, ...rest } = props
    return React.createElement('img', {
      ref,
      src,
      alt,
      className,
      onError,
      ...rest
    })
  }),
}))

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  root = null;
  rootMargin = '';
  thresholds = [];
  
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() { return []; }
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}