// Common utility types used across the application

// Generic loading state
export interface LoadingState {
  loading: boolean;
  error: string | null;
}

// Generic API response wrapper
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

// Pagination metadata
export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Generic paginated response
export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

// Event handler types
export type ClickHandler = () => void;
export type ChangeHandler<T> = (value: T) => void;
export type SubmitHandler = (event: React.FormEvent) => void;

// Component base props
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  testId?: string;
}

// Responsive breakpoint types
export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export interface ResponsiveConfig<T> {
  mobile: T;
  tablet: T;
  desktop: T;
}

// Theme and styling types
export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
}

// Animation and transition types
export type AnimationDuration = 'fast' | 'normal' | 'slow';
export type AnimationEasing = 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';

export interface AnimationConfig {
  duration: AnimationDuration;
  easing: AnimationEasing;
  delay?: number;
}