import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Toast from '../Toast';
import type { Notification } from '@/hooks/useNotifications';

// Mock setTimeout for testing
vi.useFakeTimers();

describe('Toast', () => {
  const mockOnRemove = vi.fn();

  const createNotification = (overrides: Partial<Notification> = {}): Notification => ({
    id: 'test-id',
    type: 'success',
    title: 'Test Notification',
    message: 'Test message',
    duration: 5000,
    createdAt: new Date(),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render notification with title and message', () => {
    const notification = createNotification();
    render(<Toast notification={notification} onRemove={mockOnRemove} />);

    expect(screen.getByText('Test Notification')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('should render notification without message', () => {
    const notification = createNotification({ message: undefined });
    render(<Toast notification={notification} onRemove={mockOnRemove} />);

    expect(screen.getByText('Test Notification')).toBeInTheDocument();
    expect(screen.queryByText('Test message')).not.toBeInTheDocument();
  });

  it('should call onRemove when dismiss button is clicked', () => {
    const notification = createNotification();
    render(<Toast notification={notification} onRemove={mockOnRemove} />);

    const dismissButton = screen.getByRole('button');
    fireEvent.click(dismissButton);

    expect(mockOnRemove).toHaveBeenCalledWith('test-id');
  });

  it('should auto-remove after default duration', async () => {
    const notification = createNotification();
    render(<Toast notification={notification} onRemove={mockOnRemove} />);

    // Fast-forward time by default duration
    vi.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(mockOnRemove).toHaveBeenCalledWith('test-id');
    });
  });

  it('should auto-remove after custom duration', async () => {
    const notification = createNotification({ duration: 3000 });
    render(<Toast notification={notification} onRemove={mockOnRemove} />);

    // Fast-forward time by custom duration
    vi.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(mockOnRemove).toHaveBeenCalledWith('test-id');
    });
  });

  it('should render success notification with correct styling', () => {
    const notification = createNotification({ type: 'success' });
    const { container } = render(<Toast notification={notification} onRemove={mockOnRemove} />);

    const toastElement = container.firstChild as HTMLElement;
    expect(toastElement).toHaveClass('bg-green-50', 'border-green-200', 'text-green-800');
  });

  it('should render error notification with correct styling', () => {
    const notification = createNotification({ type: 'error' });
    const { container } = render(<Toast notification={notification} onRemove={mockOnRemove} />);

    const toastElement = container.firstChild as HTMLElement;
    expect(toastElement).toHaveClass('bg-red-50', 'border-red-200', 'text-red-800');
  });

  it('should render warning notification with correct styling', () => {
    const notification = createNotification({ type: 'warning' });
    const { container } = render(<Toast notification={notification} onRemove={mockOnRemove} />);

    const toastElement = container.firstChild as HTMLElement;
    expect(toastElement).toHaveClass('bg-yellow-50', 'border-yellow-200', 'text-yellow-800');
  });

  it('should render info notification with correct styling', () => {
    const notification = createNotification({ type: 'info' });
    const { container } = render(<Toast notification={notification} onRemove={mockOnRemove} />);

    const toastElement = container.firstChild as HTMLElement;
    expect(toastElement).toHaveClass('bg-blue-50', 'border-blue-200', 'text-blue-800');
  });

  it('should have proper accessibility attributes', () => {
    const notification = createNotification();
    render(<Toast notification={notification} onRemove={mockOnRemove} />);

    const dismissButton = screen.getByRole('button');
    expect(dismissButton).toHaveAttribute('aria-label', 'Dismiss');
    expect(screen.getByText('Dismiss')).toHaveClass('sr-only');
  });

  it('should cleanup timer on unmount', () => {
    const notification = createNotification();
    const { unmount } = render(<Toast notification={notification} onRemove={mockOnRemove} />);

    // Unmount before timer expires
    unmount();

    // Fast-forward time
    vi.advanceTimersByTime(5000);

    // onRemove should not be called since component was unmounted
    expect(mockOnRemove).not.toHaveBeenCalled();
  });

  it('should handle long titles and messages gracefully', () => {
    const notification = createNotification({
      title: 'This is a very long notification title that might wrap to multiple lines',
      message: 'This is a very long notification message that contains a lot of text and might also wrap to multiple lines in the toast component',
    });

    render(<Toast notification={notification} onRemove={mockOnRemove} />);

    expect(screen.getByText(notification.title)).toBeInTheDocument();
    expect(screen.getByText(notification.message!)).toBeInTheDocument();
  });
});