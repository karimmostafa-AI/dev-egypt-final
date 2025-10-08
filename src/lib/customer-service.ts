// Customer Service
// Specialized service for customer-related operations

import { customerService } from './appwrite-service';
import { Query } from 'appwrite';
import type { Customer, Address } from '../types/admin';

export interface CustomerFilters {
  search?: string;
  status?: Customer['status'];
  segment?: Customer['segment'];
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
  minOrders?: number;
  maxOrders?: number;
  minSpent?: number;
  maxSpent?: number;
}

export interface CustomerListOptions {
  filters?: CustomerFilters;
  sortBy?: 'firstName' | 'lastName' | 'email' | 'createdAt' | 'ordersCount' | 'totalSpent' | 'lastOrderDate';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  blockedCustomers: number;
  newCustomersToday: number;
  newCustomersThisWeek: number;
  newCustomersThisMonth: number;
  vipCustomers: number;
  regularCustomers: number;
  atRiskCustomers: number;
  inactiveCustomers: number;
  averageOrdersPerCustomer: number;
  averageLifetimeValue: number;
  topCustomersBySpending: Customer[];
}

export interface CreateCustomerData {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  addresses?: Address[];
  acceptsMarketing?: boolean;
  tags?: string[];
}

export class CustomerServiceClass {
  // Get customers with advanced filtering and sorting
  async getCustomers(options: CustomerListOptions = {}) {
    try {
      const queries: string[] = [];

      // Apply filters
      if (options.filters) {
        const { filters } = options;

        if (filters.search) {
          queries.push(Query.search('firstName', filters.search));
        }

        if (filters.status) {
          queries.push(Query.equal('status', filters.status));
        }

        if (filters.segment) {
          queries.push(Query.equal('segment', filters.segment));
        }

        if (filters.dateFrom) {
          queries.push(Query.greaterThanEqual('$createdAt', filters.dateFrom));
        }

        if (filters.dateTo) {
          queries.push(Query.lessThanEqual('$createdAt', filters.dateTo));
        }

        if (filters.minOrders !== undefined) {
          queries.push(Query.greaterThanEqual('ordersCount', filters.minOrders));
        }

        if (filters.maxOrders !== undefined) {
          queries.push(Query.lessThanEqual('ordersCount', filters.maxOrders));
        }

        if (filters.minSpent !== undefined) {
          queries.push(Query.greaterThanEqual('totalSpent', filters.minSpent));
        }

        if (filters.maxSpent !== undefined) {
          queries.push(Query.lessThanEqual('totalSpent', filters.maxSpent));
        }
      }

      // Apply sorting
      if (options.sortBy) {
        const order = options.sortOrder === 'desc' ? 'DESC' : 'ASC';
        queries.push(Query.orderDesc(options.sortBy));
      } else {
        // Default sort by creation date, newest first
        queries.push(Query.orderDesc('$createdAt'));
      }

      // Apply pagination
      if (options.limit) {
        queries.push(Query.limit(options.limit));
      }
      if (options.offset) {
        queries.push(Query.offset(options.offset));
      }

      return await customerService.list<Customer>({
        queries,
        limit: options.limit,
        offset: options.offset
      });
    } catch (error) {
      console.error('Error getting customers:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get customers'
      };
    }
  }

  // Get a single customer by ID
  async getCustomer(customerId: string) {
    return await customerService.get<Customer>(customerId);
  }

  // Create a new customer
  async createCustomer(customerData: CreateCustomerData) {
    try {
      const customer: Omit<Customer, '$id' | '$createdAt' | '$updatedAt'> = {
        email: customerData.email,
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        phone: customerData.phone || '',
        addresses: customerData.addresses || [],
        ordersCount: 0,
        totalSpent: 0,
        averageOrderValue: 0,
        status: 'active',
        emailVerified: false,
        tags: customerData.tags || [],
        acceptsMarketing: customerData.acceptsMarketing || false,
        notes: []
      };

      return await customerService.create<Customer>(customer);
    } catch (error) {
      console.error('Error creating customer:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create customer'
      };
    }
  }

  // Update customer
  async updateCustomer(customerId: string, customerData: Partial<Omit<Customer, '$id' | '$createdAt' | '$updatedAt'>>) {
    return await customerService.update<Customer>(customerId, customerData);
  }

  // Delete customer
  async deleteCustomer(customerId: string) {
    return await customerService.delete(customerId);
  }

  // Update customer status
  async updateCustomerStatus(customerId: string, status: Customer['status']) {
    return await customerService.update<Customer>(customerId, {
      status,
      // Update timestamp
      $updatedAt: new Date().toISOString()
    } as any);
  }

  // Add address to customer
  async addCustomerAddress(customerId: string, address: Address) {
    try {
      const customerResponse = await customerService.get<Customer>(customerId);

      if (!customerResponse.success || !customerResponse.data) {
        return {
          success: false,
          error: 'Customer not found'
        };
      }

      const customer = customerResponse.data;
      const updatedAddresses = [...customer.addresses, address];

      return await customerService.update<Customer>(customerId, {
        addresses: updatedAddresses,
        // Update timestamp
        $updatedAt: new Date().toISOString()
      } as any);
    } catch (error) {
      console.error('Error adding customer address:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add customer address'
      };
    }
  }

  // Update customer address
  async updateCustomerAddress(customerId: string, addressIndex: number, address: Address) {
    try {
      const customerResponse = await customerService.get<Customer>(customerId);

      if (!customerResponse.success || !customerResponse.data) {
        return {
          success: false,
          error: 'Customer not found'
        };
      }

      const customer = customerResponse.data;
      const updatedAddresses = [...customer.addresses];
      updatedAddresses[addressIndex] = address;

      return await customerService.update<Customer>(customerId, {
        addresses: updatedAddresses,
        // Update timestamp
        $updatedAt: new Date().toISOString()
      } as any);
    } catch (error) {
      console.error('Error updating customer address:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update customer address'
      };
    }
  }

  // Delete customer address
  async deleteCustomerAddress(customerId: string, addressIndex: number) {
    try {
      const customerResponse = await customerService.get<Customer>(customerId);

      if (!customerResponse.success || !customerResponse.data) {
        return {
          success: false,
          error: 'Customer not found'
        };
      }

      const customer = customerResponse.data;
      const updatedAddresses = customer.addresses.filter((_, index) => index !== addressIndex);

      return await customerService.update<Customer>(customerId, {
        addresses: updatedAddresses,
        // Update timestamp
        $updatedAt: new Date().toISOString()
      } as any);
    } catch (error) {
      console.error('Error deleting customer address:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete customer address'
      };
    }
  }

  // Update customer statistics after order
  async updateCustomerStats(customerId: string, orderTotal: number) {
    try {
      const customerResponse = await customerService.get<Customer>(customerId);

      if (!customerResponse.success || !customerResponse.data) {
        return {
          success: false,
          error: 'Customer not found'
        };
      }

      const customer = customerResponse.data;
      const newOrdersCount = customer.ordersCount + 1;
      const newTotalSpent = customer.totalSpent + orderTotal;
      const newAverageOrderValue = newTotalSpent / newOrdersCount;

      return await customerService.update<Customer>(customerId, {
        ordersCount: newOrdersCount,
        totalSpent: newTotalSpent,
        averageOrderValue: newAverageOrderValue,
        lastOrderDate: new Date().toISOString(),
        // Update timestamp
        $updatedAt: new Date().toISOString()
      } as any);
    } catch (error) {
      console.error('Error updating customer stats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update customer stats'
      };
    }
  }

  // Get customer statistics
  async getCustomerStats(): Promise<{ success: boolean; data?: CustomerStats; error?: string }> {
    try {
      // Get all customers for statistics calculation
      const allCustomersResponse = await customerService.list<Customer>({
        limit: 1000 // Get all customers (adjust based on your needs)
      });

      if (!allCustomersResponse.success || !allCustomersResponse.data) {
        return {
          success: false,
          error: 'Failed to fetch customers for statistics'
        };
      }

      const customers = allCustomersResponse.data.documents;
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Calculate statistics
      const stats: CustomerStats = {
        totalCustomers: customers.length,
        activeCustomers: customers.filter(c => c.status === 'active').length,
        blockedCustomers: customers.filter(c => c.status === 'blocked').length,
        newCustomersToday: customers.filter(c => new Date(c.$createdAt) >= today).length,
        newCustomersThisWeek: customers.filter(c => new Date(c.$createdAt) >= weekAgo).length,
        newCustomersThisMonth: customers.filter(c => new Date(c.$createdAt) >= monthAgo).length,
        vipCustomers: customers.filter(c => c.segment === 'vip').length,
        regularCustomers: customers.filter(c => c.segment === 'regular').length,
        atRiskCustomers: customers.filter(c => c.segment === 'at-risk').length,
        inactiveCustomers: customers.filter(c => c.segment === 'inactive').length,
        averageOrdersPerCustomer: customers.length > 0
          ? customers.reduce((sum, c) => sum + c.ordersCount, 0) / customers.length
          : 0,
        averageLifetimeValue: customers.length > 0
          ? customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length
          : 0,
        topCustomersBySpending: customers
          .sort((a, b) => b.totalSpent - a.totalSpent)
          .slice(0, 10)
      };

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('Error getting customer statistics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get customer statistics'
      };
    }
  }

  // Search customers
  async searchCustomers(searchQuery: string, options: { limit?: number; offset?: number } = {}) {
    return await customerService.search<Customer>(searchQuery, options);
  }

  // Get customers by segment
  async getCustomersBySegment(segment: Customer['segment'], options: { limit?: number; offset?: number } = {}) {
    if (!segment) {
      return {
        success: false,
        error: 'Segment is required'
      };
    }

    return await customerService.list<Customer>({
      queries: [Query.equal('segment', segment)],
      limit: options.limit,
      offset: options.offset
    });
  }

  // Update customer segment
  async updateCustomerSegment(customerId: string, segment: Customer['segment']) {
    return await customerService.update<Customer>(customerId, {
      segment,
      // Update timestamp
      $updatedAt: new Date().toISOString()
    } as any);
  }

  // Add customer note
  async addCustomerNote(customerId: string, note: string, addedBy: string = 'admin') {
    try {
      const customerResponse = await customerService.get<Customer>(customerId);

      if (!customerResponse.success || !customerResponse.data) {
        return {
          success: false,
          error: 'Customer not found'
        };
      }

      const customer = customerResponse.data;
      const newNote = {
        $id: `note_${Date.now()}`,
        note,
        userId: addedBy,
        userName: addedBy,
        createdAt: new Date().toISOString()
      };

      const updatedNotes = [...customer.notes, newNote];

      return await customerService.update<Customer>(customerId, {
        notes: updatedNotes,
        // Update timestamp
        $updatedAt: new Date().toISOString()
      } as any);
    } catch (error) {
      console.error('Error adding customer note:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add customer note'
      };
    }
  }

  // Validate customer data
  validateCustomerData(data: CreateCustomerData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.email || !data.email.includes('@')) {
      errors.push('Valid email is required');
    }

    if (!data.firstName || data.firstName.trim().length === 0) {
      errors.push('First name is required');
    }

    if (!data.lastName || data.lastName.trim().length === 0) {
      errors.push('Last name is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const customerServiceFunctions = new CustomerServiceClass();