// Product Form Validation and State Management Tests
// Comprehensive tests to validate form behavior and prevent regressions

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import NewProductPage from '@/app/admin/products/new/page';

// Mock Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock fetch globally
global.fetch = vi.fn();

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-object-url');

// Mock Image constructor for tests
global.Image = class {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  src = '';

  constructor() {
    setTimeout(() => {
      if (this.onload) {
        this.onload();
      }
    }, 100);
  }
} as any;

describe('Product Creation Form', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();

    // Mock successful API responses
    (fetch as Mock).mockImplementation((url: string) => {
      if (url.includes('/api/admin/brands')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            brands: [
              { $id: 'brand1', name: 'Test Brand', prefix: 'TB', status: true }
            ]
          }),
        });
      }
      if (url.includes('/api/admin/categories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            categories: [
              { $id: 'cat1', name: 'Test Category', status: true }
            ]
          }),
        });
      }
      if (url.includes('/api/admin/products')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            product: {
              $id: 'product1',
              name: 'Test Product',
              slug: 'test-product',
              price: 29.99,
              brand_id: 'brand1',
              category_id: 'cat1',
            }
          }),
        });
      }
      return Promise.reject(new Error('Unknown API endpoint'));
    });
  });

  describe('Form State Management', () => {
    it('should maintain form data when switching between tabs', async () => {
      render(<NewProductPage />);

      // Wait for initial data to load
      await waitFor(() => {
        expect(screen.getByText('Add New Product')).toBeInTheDocument();
      });

      // Fill in basic information
      const nameInput = screen.getByLabelText(/product name/i);
      const priceInput = screen.getByLabelText(/price/i);

      await user.type(nameInput, 'Test Product');
      await user.type(priceInput, '29.99');

      // Select brand and category (after they load)
      await waitFor(() => {
        const brandSelect = screen.getByRole('combobox', { name: /brand/i });
        fireEvent.click(brandSelect);
      });

      await waitFor(() => {
        const brandOption = screen.getByText('Test Brand');
        fireEvent.click(brandOption);
      });

      await waitFor(() => {
        const categorySelect = screen.getByRole('combobox', { name: /category/i });
        fireEvent.click(categorySelect);
      });

      await waitFor(() => {
        const categoryOption = screen.getByText('Test Category');
        fireEvent.click(categoryOption);
      });

      // Verify form data is filled
      expect(nameInput).toHaveValue('Test Product');
      expect(priceInput).toHaveValue(29.99);

      // Switch to images tab
      const imagesTab = screen.getByRole('tab', { name: /images/i });
      await user.click(imagesTab);

      // Switch back to basic info tab
      const basicTab = screen.getByRole('tab', { name: /basic info/i });
      await user.click(basicTab);

      // Verify form data is still there
      await waitFor(() => {
        expect(nameInput).toHaveValue('Test Product');
        expect(priceInput).toHaveValue(29.99);
      });
    });

    it('should maintain variation data when switching tabs', async () => {
      render(<NewProductPage />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Add New Product')).toBeInTheDocument();
      });

      // Enable variations
      const variationsSwitch = screen.getByRole('checkbox', { name: /has multiple colors/i });
      await user.click(variationsSwitch);

      // Switch to variations tab
      const variationsTab = screen.getByRole('tab', { name: /variations/i });
      await user.click(variationsTab);

      // Add a color
      const colorNameInput = screen.getByPlaceholderText(/navy blue/i);
      await user.type(colorNameInput, 'Navy Blue');

      const addColorButton = screen.getByRole('button', { name: /add color/i });
      await user.click(addColorButton);

      // Verify color was added
      await waitFor(() => {
        expect(screen.getByText('Navy Blue')).toBeInTheDocument();
      });

      // Switch to images tab
      const imagesTab = screen.getByRole('tab', { name: /images/i });
      await user.click(imagesTab);

      // Switch back to variations tab
      await user.click(variationsTab);

      // Verify color is still there
      await waitFor(() => {
        expect(screen.getByText('Navy Blue')).toBeInTheDocument();
      });
    });

    it('should maintain image selections when switching tabs', async () => {
      render(<NewProductPage />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Add New Product')).toBeInTheDocument();
      });

      // Switch to images tab
      const imagesTab = screen.getByRole('tab', { name: /images/i });
      await user.click(imagesTab);

      // Mock file selection for main image
      const mainFileInput = screen.getByLabelText(/main view image/i).querySelector('input[type="file"]') as HTMLInputElement;

      if (mainFileInput) {
        const file = new File(['test'], 'test-image.jpg', { type: 'image/jpeg' });
        Object.defineProperty(mainFileInput, 'files', {
          value: [file],
          writable: false,
        });

        fireEvent.change(mainFileInput);

        // Wait for image to be processed
        await waitFor(() => {
          expect(screen.getByText(/main view/i)).toBeInTheDocument();
        });
      }

      // Switch to basic info tab
      const basicTab = screen.getByRole('tab', { name: /basic info/i });
      await user.click(basicTab);

      // Switch back to images tab
      await user.click(imagesTab);

      // Verify image is still selected
      await waitFor(() => {
        expect(screen.getByText(/main view/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('should prevent submission when required fields are missing', async () => {
      render(<NewProductPage />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Add New Product')).toBeInTheDocument();
      });

      // Try to submit without filling required fields
      const submitButton = screen.getByRole('button', { name: /create product/i });
      expect(submitButton).toBeDisabled();

      // Should show validation errors
      expect(screen.getByText(/complete all required fields/i)).toBeInTheDocument();
    });

    it('should prevent submission when images are missing', async () => {
      render(<NewProductPage />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Add New Product')).toBeInTheDocument();
      });

      // Fill in basic required fields
      await user.type(screen.getByLabelText(/product name/i), 'Test Product');
      await user.type(screen.getByLabelText('Price *'), '29.99');

      // Select brand and category
      await waitFor(() => {
        const brandSelect = screen.getByRole('combobox', { name: /brand/i });
        fireEvent.click(brandSelect);
      });

      await waitFor(() => {
        const brandOption = screen.getByText('Test Brand');
        fireEvent.click(brandOption);
      });

      // Try to submit without images
      const submitButton = screen.getByRole('button', { name: /create product/i });
      await user.click(submitButton);

      // Should show error about missing images
      await waitFor(() => {
        expect(screen.getByText(/both main view and back view images are required/i)).toBeInTheDocument();
      });

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should prevent submission when variations are incomplete', async () => {
      render(<NewProductPage />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Add New Product')).toBeInTheDocument();
      });

      // Fill in basic required fields
      await user.type(screen.getByLabelText(/product name/i), 'Test Product');
      await user.type(screen.getByLabelText('Price *'), '29.99');

      // Select brand and category
      await waitFor(() => {
        const brandSelect = screen.getByRole('combobox', { name: /brand/i });
        fireEvent.click(brandSelect);
      });

      await waitFor(() => {
        const brandOption = screen.getByText('Test Brand');
        fireEvent.click(brandOption);
      });

      // Enable variations but don't configure them
      const variationsSwitch = screen.getByRole('checkbox', { name: /has multiple colors/i });
      await user.click(variationsSwitch);

      // Try to submit
      const submitButton = screen.getByRole('button', { name: /create product/i });
      await user.click(submitButton);

      // Should show error about incomplete variations
      await waitFor(() => {
        expect(screen.getByText(/at least one color is required/i)).toBeInTheDocument();
      });

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should allow submission when all required fields are complete', async () => {
      render(<NewProductPage />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Add New Product')).toBeInTheDocument();
      });

      // Fill in all required fields
      await user.type(screen.getByLabelText(/product name/i), 'Test Product');
      await user.type(screen.getByLabelText('Price *'), '29.99');

      // Select brand and category
      await waitFor(() => {
        const brandSelect = screen.getByRole('combobox', { name: /brand/i });
        fireEvent.click(brandSelect);
      });

      await waitFor(() => {
        const brandOption = screen.getByText('Test Brand');
        fireEvent.click(brandOption);
      });

      // Mock image upload for main and back images
      const imagesTab = screen.getByRole('tab', { name: /images/i });
      await user.click(imagesTab);

      // Wait for form to be valid
      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /create product/i });
        expect(submitButton).not.toBeDisabled();
      });

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /create product/i });
      await user.click(submitButton);

      // Should redirect to products list
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/admin/products');
      });
    });
  });

  describe('Real-time Validation', () => {
    it('should show validation errors as user types invalid data', async () => {
      render(<NewProductPage />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Add New Product')).toBeInTheDocument();
      });

      // Try to enter invalid price (main price field)
      const priceInput = screen.getByLabelText('Price *');
      await user.type(priceInput, '-10');

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/price must be greater than 0/i)).toBeInTheDocument();
      });
    });

    it('should clear validation errors when user fixes the issues', async () => {
      render(<NewProductPage />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Add New Product')).toBeInTheDocument();
      });

      // Enter invalid price (main price field)
      const priceInput = screen.getByLabelText('Price *');
      await user.type(priceInput, '-10');

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/price must be greater than 0/i)).toBeInTheDocument();
      });

      // Fix the price
      await user.clear(priceInput);
      await user.type(priceInput, '29.99');

      // Error should disappear
      await waitFor(() => {
        expect(screen.queryByText(/price must be greater than 0/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission Process', () => {
    it('should call API with correct data structure', async () => {
      render(<NewProductPage />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Add New Product')).toBeInTheDocument();
      });

      // Fill in complete form data
      await user.type(screen.getByLabelText(/product name/i), 'Test Product');
      await user.type(screen.getByLabelText('Price *'), '29.99');
      await user.type(screen.getByLabelText('Description'), 'Test description');

      // Select brand and category
      await waitFor(() => {
        const brandSelect = screen.getByRole('combobox', { name: /brand/i });
        fireEvent.click(brandSelect);
      });

      await waitFor(() => {
        const brandOption = screen.getByText('Test Brand');
        fireEvent.click(brandOption);
      });

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /create product/i });
      await user.click(submitButton);

      // Verify API was called with correct data
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/admin/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('"name":"Test Product"'),
        });
      });
    });

    it('should handle API errors gracefully', async () => {
      // Mock API error
      (fetch as Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Database error' }),
        })
      );

      render(<NewProductPage />);

      // Wait for initial load and fill form
      await waitFor(() => {
        expect(screen.getByText('Add New Product')).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/product name/i), 'Test Product');
      await user.type(screen.getByLabelText(/price/i), '29.99');

      // Submit and expect error
      const submitButton = screen.getByRole('button', { name: /create product/i });
      await user.click(submitButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/error creating product/i)).toBeInTheDocument();
      });

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('State Persistence', () => {
    it('should maintain form state during component re-renders', async () => {
      const { rerender } = render(<NewProductPage />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Add New Product')).toBeInTheDocument();
      });

      // Fill form
      await user.type(screen.getByLabelText(/product name/i), 'Persistent Product');

      // Re-render component
      rerender(<NewProductPage />);

      // Form data should still be there
      await waitFor(() => {
        expect(screen.getByDisplayValue('Persistent Product')).toBeInTheDocument();
      });
    });
  });
});

export {};