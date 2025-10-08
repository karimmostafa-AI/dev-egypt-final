// Appwrite Cloud Functions for Customer Management
// These functions handle server-side customer business logic

import { Client, Databases, Query, ID } from 'appwrite';

// Types for function parameters and responses
export interface CustomerFunctionRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers: Record<string, string>;
  body?: any;
  pathParameters?: Record<string, string>;
  queryParameters?: Record<string, string>;
}

export interface CustomerFunctionResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
}

export interface CreateCustomerData {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  addresses?: Array<{
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
  }>;
  acceptsMarketing?: boolean;
  tags?: string[];
}

export interface CustomerSegmentationData {
  customerId: string;
  segment: 'vip' | 'regular' | 'at-risk' | 'inactive';
  reason?: string;
}

// Initialize Appwrite client (for cloud functions)
function initializeAppwrite(): Databases {
  const client = new Client();

  // Set configuration from environment variables
  const endpoint = process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
  const projectId = process.env.APPWRITE_PROJECT_ID || '';

  client
    .setEndpoint(endpoint)
    .setProject(projectId);

  return new Databases(client);
}

// Initialize Appwrite services
const databases = initializeAppwrite();
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || '';
const CUSTOMERS_COLLECTION_ID = 'customers';
const ORDERS_COLLECTION_ID = 'orders';

/**
 * Create a new customer
 */
export async function createCustomer(request: CustomerFunctionRequest): Promise<CustomerFunctionResponse> {
  try {
    const customerData: CreateCustomerData = request.body;

    // Validate required fields
    if (!customerData.email || !customerData.firstName || !customerData.lastName) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: false,
          error: 'Missing required fields: email, firstName, lastName'
        }
      };
    }

    // Check if customer already exists
    const existingCustomers = await databases.listDocuments(
      DATABASE_ID,
      CUSTOMERS_COLLECTION_ID,
      [Query.equal('email', customerData.email)]
    );

    if (existingCustomers.documents.length > 0) {
      return {
        statusCode: 409,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: false,
          error: 'Customer with this email already exists'
        }
      };
    }

    // Create customer
    const customer = {
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
      segment: 'regular' as const,
      acceptsMarketing: customerData.acceptsMarketing || false,
      notes: []
    };

    const createdCustomer = await databases.createDocument(
      DATABASE_ID,
      CUSTOMERS_COLLECTION_ID,
      ID.unique(),
      customer
    );

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: true,
        data: createdCustomer
      }
    };
  } catch (error) {
    console.error('Error creating customer:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: false,
        error: 'Failed to create customer',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Get customer by ID
 */
export async function getCustomer(request: CustomerFunctionRequest): Promise<CustomerFunctionResponse> {
  try {
    const { customerId } = request.pathParameters || {};

    if (!customerId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: false,
          error: 'Customer ID is required'
        }
      };
    }

    const customer = await databases.getDocument(
      DATABASE_ID,
      CUSTOMERS_COLLECTION_ID,
      customerId
    );

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: true,
        data: customer
      }
    };
  } catch (error) {
    console.error('Error getting customer:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: false,
        error: 'Failed to get customer',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Update customer
 */
export async function updateCustomer(request: CustomerFunctionRequest): Promise<CustomerFunctionResponse> {
  try {
    const { customerId } = request.pathParameters || {};
    const updateData = request.body;

    if (!customerId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: false,
          error: 'Customer ID is required'
        }
      };
    }

    // If updating email, check for uniqueness
    if (updateData.email) {
      const existingCustomers = await databases.listDocuments(
        DATABASE_ID,
        CUSTOMERS_COLLECTION_ID,
        [Query.equal('email', updateData.email), Query.notEqual('$id', customerId)]
      );

      if (existingCustomers.documents.length > 0) {
        return {
          statusCode: 409,
          headers: { 'Content-Type': 'application/json' },
          body: {
            success: false,
            error: 'Email already exists'
          }
        };
      }
    }

    const customer = await databases.updateDocument(
      DATABASE_ID,
      CUSTOMERS_COLLECTION_ID,
      customerId,
      updateData
    );

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: true,
        data: customer
      }
    };
  } catch (error) {
    console.error('Error updating customer:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: false,
        error: 'Failed to update customer',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Delete customer
 */
export async function deleteCustomer(request: CustomerFunctionRequest): Promise<CustomerFunctionResponse> {
  try {
    const { customerId } = request.pathParameters || {};

    if (!customerId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: false,
          error: 'Customer ID is required'
        }
      };
    }

    // Check if customer has orders
    const orders = await databases.listDocuments(
      DATABASE_ID,
      ORDERS_COLLECTION_ID,
      [Query.equal('customerId', customerId)]
    );

    if (orders.documents.length > 0) {
      return {
        statusCode: 409,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: false,
          error: 'Cannot delete customer with existing orders'
        }
      };
    }

    await databases.deleteDocument(
      DATABASE_ID,
      CUSTOMERS_COLLECTION_ID,
      customerId
    );

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: true,
        message: 'Customer deleted successfully'
      }
    };
  } catch (error) {
    console.error('Error deleting customer:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: false,
        error: 'Failed to delete customer',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Get customers with filtering and pagination
 */
export async function getCustomers(request: CustomerFunctionRequest): Promise<CustomerFunctionResponse> {
  try {
    const {
      search,
      status,
      segment,
      tags,
      limit = '25',
      offset = '0',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = request.queryParameters || {};

    const queries = [];

    // Add search query
    if (search) {
      queries.push(Query.search('firstName', search));
    }

    // Add filters
    if (status) {
      queries.push(Query.equal('status', status));
    }

    if (segment) {
      queries.push(Query.equal('segment', segment));
    }

    // Add sorting
    if (sortOrder === 'desc') {
      queries.push(Query.orderDesc(sortBy));
    } else {
      queries.push(Query.orderAsc(sortBy));
    }

    // Add pagination
    queries.push(Query.limit(parseInt(limit)));
    queries.push(Query.offset(parseInt(offset)));

    const result = await databases.listDocuments(
      DATABASE_ID,
      CUSTOMERS_COLLECTION_ID,
      queries
    );

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: true,
        data: {
          customers: result.documents,
          total: result.total,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      }
    };
  } catch (error) {
    console.error('Error getting customers:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: false,
        error: 'Failed to get customers',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Update customer segment
 */
export async function updateCustomerSegment(request: CustomerFunctionRequest): Promise<CustomerFunctionResponse> {
  try {
    const { customerId } = request.pathParameters || {};
    const { segment, reason }: { segment: string; reason?: string } = request.body;

    if (!customerId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: false,
          error: 'Customer ID is required'
        }
      };
    }

    if (!segment) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: false,
          error: 'Segment is required'
        }
      };
    }

    // Get current customer
    const customer = await databases.getDocument(
      DATABASE_ID,
      CUSTOMERS_COLLECTION_ID,
      customerId
    );

    // Update customer segment
    const updatedCustomer = await databases.updateDocument(
      DATABASE_ID,
      CUSTOMERS_COLLECTION_ID,
      customerId,
      {
        segment,
        // You might want to add a segment history here
      }
    );

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: true,
        data: {
          customer: updatedCustomer,
          previousSegment: customer.segment,
          newSegment: segment,
          reason
        }
      }
    };
  } catch (error) {
    console.error('Error updating customer segment:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: false,
        error: 'Failed to update customer segment',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Add customer address
 */
export async function addCustomerAddress(request: CustomerFunctionRequest): Promise<CustomerFunctionResponse> {
  try {
    const { customerId } = request.pathParameters || {};
    const address = request.body;

    if (!customerId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: false,
          error: 'Customer ID is required'
        }
      };
    }

    if (!address || !address.fullName || !address.addressLine1) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: false,
          error: 'Address data is required'
        }
      };
    }

    // Get current customer
    const customer = await databases.getDocument(
      DATABASE_ID,
      CUSTOMERS_COLLECTION_ID,
      customerId
    );

    // Add new address
    const updatedAddresses = [...customer.addresses, address];

    const updatedCustomer = await databases.updateDocument(
      DATABASE_ID,
      CUSTOMERS_COLLECTION_ID,
      customerId,
      {
        addresses: updatedAddresses
      }
    );

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: true,
        data: updatedCustomer
      }
    };
  } catch (error) {
    console.error('Error adding customer address:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: false,
        error: 'Failed to add customer address',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Update customer statistics after order
 */
export async function updateCustomerStats(request: CustomerFunctionRequest): Promise<CustomerFunctionResponse> {
  try {
    const { customerId } = request.pathParameters || {};
    const { orderTotal } = request.body;

    if (!customerId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: false,
          error: 'Customer ID is required'
        }
      };
    }

    if (!orderTotal || typeof orderTotal !== 'number') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: false,
          error: 'Order total is required and must be a number'
        }
      };
    }

    // Get current customer
    const customer = await databases.getDocument(
      DATABASE_ID,
      CUSTOMERS_COLLECTION_ID,
      customerId
    );

    // Update statistics
    const newOrdersCount = customer.ordersCount + 1;
    const newTotalSpent = customer.totalSpent + orderTotal;
    const newAverageOrderValue = newTotalSpent / newOrdersCount;

    // Determine new segment based on spending
    let newSegment = customer.segment;
    if (newTotalSpent >= 1000) {
      newSegment = 'vip';
    } else if (newTotalSpent >= 500) {
      newSegment = 'regular';
    } else if (newOrdersCount > 5) {
      newSegment = 'regular';
    } else {
      newSegment = 'regular';
    }

    const updatedCustomer = await databases.updateDocument(
      DATABASE_ID,
      CUSTOMERS_COLLECTION_ID,
      customerId,
      {
        ordersCount: newOrdersCount,
        totalSpent: newTotalSpent,
        averageOrderValue: newAverageOrderValue,
        lastOrderDate: new Date().toISOString(),
        segment: newSegment
      }
    );

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: true,
        data: {
          customer: updatedCustomer,
          stats: {
            previousOrdersCount: customer.ordersCount,
            newOrdersCount,
            previousTotalSpent: customer.totalSpent,
            newTotalSpent,
            previousSegment: customer.segment,
            newSegment
          }
        }
      }
    };
  } catch (error) {
    console.error('Error updating customer stats:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: false,
        error: 'Failed to update customer stats',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Get customer statistics
 */
export async function getCustomerStats(request: CustomerFunctionRequest): Promise<CustomerFunctionResponse> {
  try {
    // Get all customers for statistics
    const result = await databases.listDocuments(
      DATABASE_ID,
      CUSTOMERS_COLLECTION_ID,
      [Query.limit(1000)]
    );

    const customers = result.documents;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats = {
      totalCustomers: customers.length,
      activeCustomers: customers.filter((c: any) => c.status === 'active').length,
      blockedCustomers: customers.filter((c: any) => c.status === 'blocked').length,
      newCustomersToday: customers.filter((c: any) => new Date(c.$createdAt) >= today).length,
      newCustomersThisWeek: customers.filter((c: any) => new Date(c.$createdAt) >= weekAgo).length,
      newCustomersThisMonth: customers.filter((c: any) => new Date(c.$createdAt) >= monthAgo).length,
      vipCustomers: customers.filter((c: any) => c.segment === 'vip').length,
      regularCustomers: customers.filter((c: any) => c.segment === 'regular').length,
      atRiskCustomers: customers.filter((c: any) => c.segment === 'at-risk').length,
      inactiveCustomers: customers.filter((c: any) => c.segment === 'inactive').length,
      averageOrdersPerCustomer: customers.length > 0
        ? customers.reduce((sum: number, c: any) => sum + c.ordersCount, 0) / customers.length
        : 0,
      averageLifetimeValue: customers.length > 0
        ? customers.reduce((sum: number, c: any) => sum + c.totalSpent, 0) / customers.length
        : 0,
      topCustomersBySpending: customers
        .sort((a: any, b: any) => b.totalSpent - a.totalSpent)
        .slice(0, 10)
        .map((c: any) => ({
          id: c.$id,
          name: `${c.firstName} ${c.lastName}`,
          email: c.email,
          totalSpent: c.totalSpent,
          ordersCount: c.ordersCount,
          segment: c.segment
        }))
    };

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: true,
        data: stats
      }
    };
  } catch (error) {
    console.error('Error getting customer statistics:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: false,
        error: 'Failed to get customer statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Bulk update customers
 */
export async function bulkUpdateCustomers(request: CustomerFunctionRequest): Promise<CustomerFunctionResponse> {
  try {
    const { customerIds, updates } = request.body;

    if (!Array.isArray(customerIds) || !updates) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: false,
          error: 'customerIds array and updates object are required'
        }
      };
    }

    const results = [];

    for (const customerId of customerIds) {
      try {
        const updatedCustomer = await databases.updateDocument(
          DATABASE_ID,
          CUSTOMERS_COLLECTION_ID,
          customerId,
          updates
        );

        results.push({
          customerId,
          success: true,
          data: updatedCustomer
        });
      } catch (error) {
        results.push({
          customerId,
          success: false,
          error: error instanceof Error ? error.message : 'Update failed'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: failureCount === 0,
        data: {
          results,
          summary: {
            total: results.length,
            successful: successCount,
            failed: failureCount
          }
        }
      }
    };
  } catch (error) {
    console.error('Error bulk updating customers:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: false,
        error: 'Failed to bulk update customers',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Run customer segmentation analysis
 */
export async function runCustomerSegmentation(request: CustomerFunctionRequest): Promise<CustomerFunctionResponse> {
  try {
    // Get all customers
    const result = await databases.listDocuments(
      DATABASE_ID,
      CUSTOMERS_COLLECTION_ID,
      [Query.limit(1000)]
    );

    const customers = result.documents;
    const updates = [];

    for (const customer of customers) {
      let newSegment = customer.segment;
      const daysSinceLastOrder = customer.lastOrderDate
        ? Math.floor((Date.now() - new Date(customer.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24))
        : Infinity;

      // VIP: High spending customers
      if (customer.totalSpent >= 1000 && customer.ordersCount >= 3) {
        newSegment = 'vip';
      }
      // At-risk: Haven't ordered in 90+ days but have ordered before
      else if (daysSinceLastOrder >= 90 && customer.ordersCount > 0) {
        newSegment = 'at-risk';
      }
      // Inactive: No orders or haven't ordered in 180+ days
      else if (customer.ordersCount === 0 || daysSinceLastOrder >= 180) {
        newSegment = 'inactive';
      }
      // Regular: Everyone else
      else {
        newSegment = 'regular';
      }

      if (newSegment !== customer.segment) {
        updates.push({
          customerId: customer.$id,
          oldSegment: customer.segment,
          newSegment,
          reason: `Automated segmentation: ${daysSinceLastOrder} days since last order, $${customer.totalSpent} total spent`
        });
      }
    }

    // Apply updates
    const updateResults = [];
    for (const update of updates) {
      try {
        await databases.updateDocument(
          DATABASE_ID,
          CUSTOMERS_COLLECTION_ID,
          update.customerId,
          { segment: update.newSegment }
        );

        updateResults.push({
          customerId: update.customerId,
          success: true,
          oldSegment: update.oldSegment,
          newSegment: update.newSegment
        });
      } catch (error) {
        updateResults.push({
          customerId: update.customerId,
          success: false,
          error: error instanceof Error ? error.message : 'Update failed'
        });
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: true,
        data: {
          totalAnalyzed: customers.length,
          totalUpdated: updateResults.filter(r => r.success).length,
          updates: updateResults
        }
      }
    };
  } catch (error) {
    console.error('Error running customer segmentation:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: false,
        error: 'Failed to run customer segmentation',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}