'use client';

import { useState, useEffect } from 'react';
import MainLayout from '../../../components/MainLayout';
import { Order } from '../../../types/admin';
import { Package, Truck, CheckCircle, XCircle, Clock, Eye, Download, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface OrderWithCustomer extends Order {
  customerName?: string;
  customerEmail?: string;
}

const statusConfig = {
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  },
  processing: {
    label: 'Processing',
    icon: Package,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  shipped: {
    label: 'Shipped',
    icon: Truck,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  delivered: {
    label: 'Delivered',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  refunded: {
    label: 'Refunded',
    icon: XCircle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200'
  }
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Mock user ID - in a real app, this would come from authentication context
  const currentUserId = 'user_123'; // This should be replaced with actual user ID from auth context

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      // In a real implementation, you'd fetch orders for the current user
      // For now, we'll use mock data to demonstrate the UI
      const mockOrders: OrderWithCustomer[] = [
        {
          $id: 'order_1',
          $createdAt: '2024-01-15T10:30:00Z',
          $updatedAt: '2024-01-15T10:30:00Z',
          orderNumber: 'DE-2024-001234',
          customerId: 'user_123',
          customerName: 'John Doe',
          customerEmail: 'john.doe@example.com',
          items: [
            {
              productId: 'prod_1',
              productName: 'Dev Egypt Professional Scrub Top',
              productImage: 'https://via.placeholder.com/100x100?text=Scrub+Top',
              sku: 'DE-ST-001',
              quantity: 2,
              price: 299,
              total: 598
            },
            {
              productId: 'prod_2',
              productName: 'Dev Egypt Comfortable Scrub Pants',
              productImage: 'https://via.placeholder.com/100x100?text=Scrub+Pants',
              sku: 'DE-SP-001',
              quantity: 1,
              price: 199,
              total: 199
            }
          ],
          subtotal: 797,
          shippingCost: 50,
          taxAmount: 84.67,
          discountAmount: 0,
          total: 931.67,
          status: 'delivered',
          paymentStatus: 'paid',
          fulfillmentStatus: 'fulfilled',
          paymentMethod: 'credit_card',
          shippingAddress: {
            fullName: 'John Doe',
            addressLine1: '123 Main Street',
            addressLine2: 'Apt 4B',
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'USA',
            phone: '+1 (555) 123-4567'
          },
          billingAddress: {
            fullName: 'John Doe',
            addressLine1: '123 Main Street',
            addressLine2: 'Apt 4B',
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'USA',
            phone: '+1 (555) 123-4567'
          },
          trackingNumber: 'TRK123456789',
          carrier: 'UPS',
          shippedAt: '2024-01-16T09:00:00Z',
          deliveredAt: '2024-01-18T14:30:00Z',
          customerNote: 'Please leave at front door if not home',
          internalNotes: [],
          timeline: [
            {
              status: 'pending',
              changedBy: 'system',
              changedAt: '2024-01-15T10:30:00Z',
              note: 'Order placed successfully'
            },
            {
              status: 'processing',
              changedBy: 'admin',
              changedAt: '2024-01-15T11:00:00Z',
              note: 'Payment confirmed, order being processed'
            },
            {
              status: 'shipped',
              changedBy: 'admin',
              changedAt: '2024-01-16T09:00:00Z',
              note: 'Order shipped via UPS'
            },
            {
              status: 'delivered',
              changedBy: 'system',
              changedAt: '2024-01-18T14:30:00Z',
              note: 'Order delivered successfully'
            }
          ]
        },
        {
          $id: 'order_2',
          $createdAt: '2024-01-10T15:45:00Z',
          $updatedAt: '2024-01-10T15:45:00Z',
          orderNumber: 'DE-2024-001233',
          customerId: 'user_123',
          customerName: 'John Doe',
          customerEmail: 'john.doe@example.com',
          items: [
            {
              productId: 'prod_3',
              productName: 'Cherokee Classic Scrub Set',
              productImage: 'https://via.placeholder.com/100x100?text=Scrub+Set',
              sku: 'CHE-SS-001',
              quantity: 1,
              price: 449,
              total: 449
            }
          ],
          subtotal: 449,
          shippingCost: 0,
          taxAmount: 47.74,
          discountAmount: 44.90,
          total: 451.84,
          status: 'shipped',
          paymentStatus: 'paid',
          fulfillmentStatus: 'fulfilled',
          paymentMethod: 'credit_card',
          shippingAddress: {
            fullName: 'John Doe',
            addressLine1: '123 Main Street',
            addressLine2: 'Apt 4B',
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'USA',
            phone: '+1 (555) 123-4567'
          },
          billingAddress: {
            fullName: 'John Doe',
            addressLine1: '123 Main Street',
            addressLine2: 'Apt 4B',
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'USA',
            phone: '+1 (555) 123-4567'
          },
          trackingNumber: 'TRK987654321',
          carrier: 'FedEx',
          shippedAt: '2024-01-11T10:00:00Z',
          customerNote: 'Handle with care - fragile items',
          internalNotes: [],
          timeline: [
            {
              status: 'pending',
              changedBy: 'system',
              changedAt: '2024-01-10T15:45:00Z',
              note: 'Order placed successfully'
            },
            {
              status: 'processing',
              changedBy: 'admin',
              changedAt: '2024-01-10T16:00:00Z',
              note: 'Payment confirmed, preparing for shipment'
            },
            {
              status: 'shipped',
              changedBy: 'admin',
              changedAt: '2024-01-11T10:00:00Z',
              note: 'Order shipped via FedEx'
            }
          ]
        },
        {
          $id: 'order_3',
          $createdAt: '2024-01-05T09:15:00Z',
          $updatedAt: '2024-01-05T09:15:00Z',
          orderNumber: 'DE-2024-001232',
          customerId: 'user_123',
          customerName: 'John Doe',
          customerEmail: 'john.doe@example.com',
          items: [
            {
              productId: 'prod_4',
              productName: 'Dev Egypt Professional Lab Coat',
              productImage: 'https://via.placeholder.com/100x100?text=Lab+Coat',
              sku: 'DE-LC-001',
              quantity: 1,
              price: 599,
              total: 599
            }
          ],
          subtotal: 599,
          shippingCost: 25,
          taxAmount: 64.14,
          discountAmount: 0,
          total: 688.14,
          status: 'processing',
          paymentStatus: 'paid',
          fulfillmentStatus: 'unfulfilled',
          paymentMethod: 'paypal',
          shippingAddress: {
            fullName: 'John Doe',
            addressLine1: '123 Main Street',
            addressLine2: 'Apt 4B',
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'USA',
            phone: '+1 (555) 123-4567'
          },
          billingAddress: {
            fullName: 'John Doe',
            addressLine1: '123 Main Street',
            addressLine2: 'Apt 4B',
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'USA',
            phone: '+1 (555) 123-4567'
          },
          customerNote: 'White lab coat, size medium',
          internalNotes: [],
          timeline: [
            {
              status: 'pending',
              changedBy: 'system',
              changedAt: '2024-01-05T09:15:00Z',
              note: 'Order placed successfully'
            },
            {
              status: 'processing',
              changedBy: 'admin',
              changedAt: '2024-01-05T09:30:00Z',
              note: 'Payment confirmed, preparing your order'
            }
          ]
        }
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      setOrders(mockOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = selectedStatus === 'all'
    ? orders
    : orders.filter(order => order.status === selectedStatus);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusIcon = (status: Order['status']) => {
    const config = statusConfig[status];
    const Icon = config.icon;
    return <Icon className={`h-4 w-4 ${config.color}`} />;
  };

  const getStatusBadge = (status: Order['status']) => {
    const config = statusConfig[status];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${config.bgColor} ${config.color} ${config.borderColor} border`}>
        {getStatusIcon(status)}
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-[1920px] mx-auto px-[50px] py-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-lg p-6">
                    <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-[1920px] mx-auto px-[50px] py-8">
            <div className="text-center">
              <div className="text-red-400 text-4xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Orders</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={fetchOrders}
                className="inline-flex items-center gap-2 bg-[#173a6a] text-white px-4 py-2 rounded-lg hover:bg-[#1e4a7a] transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-[1920px] mx-auto px-[50px] py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Order History</h1>
            <p className="text-gray-600">
              View and track all your orders. You have {orders.length} total orders.
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Filter by status:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#173a6a] focus:border-[#173a6a]"
                >
                  <option value="all">All Orders</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Showing {filteredOrders.length} of {orders.length} orders</span>
              </div>
            </div>
          </div>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <div className="text-center py-16">
              <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {selectedStatus === 'all' ? 'No orders found' : `No ${selectedStatus} orders`}
              </h3>
              <p className="text-gray-600 mb-6">
                {selectedStatus === 'all'
                  ? "You haven't placed any orders yet."
                  : `You don't have any orders with ${selectedStatus} status.`
                }
              </p>
              <Link
                href="/catalog"
                className="inline-flex items-center gap-2 bg-[#173a6a] text-white px-6 py-3 rounded-lg hover:bg-[#1e4a7a] transition-colors font-medium"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredOrders.map((order) => (
                <div key={order.$id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  {/* Order Header */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Order #{order.orderNumber}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Placed on {formatDate(order.$createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {getStatusBadge(order.status)}
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            {formatCurrency(order.total)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="p-6">
                    <div className="space-y-4">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            {item.productImage ? (
                              <img
                                src={item.productImage}
                                alt={item.productName}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <Package className="h-8 w-8 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{item.productName}</h4>
                            <p className="text-sm text-gray-600">SKU: {item.sku}</p>
                            <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              {formatCurrency(item.total)}
                            </p>
                            <p className="text-sm text-gray-600">
                              {formatCurrency(item.price)} each
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order Summary */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-medium">{formatCurrency(order.subtotal)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Shipping:</span>
                        <span className="font-medium">
                          {order.shippingCost === 0 ? 'FREE' : formatCurrency(order.shippingCost)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Tax:</span>
                        <span className="font-medium">{formatCurrency(order.taxAmount)}</span>
                      </div>
                      {order.discountAmount > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-green-600">Discount:</span>
                          <span className="font-medium text-green-600">
                            -{formatCurrency(order.discountAmount)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-lg font-bold pt-2 border-t border-gray-200">
                        <span>Total:</span>
                        <span className="text-[#173a6a]">{formatCurrency(order.total)}</span>
                      </div>
                    </div>

                    {/* Shipping Information */}
                    {(order.status === 'shipped' || order.status === 'delivered') && order.trackingNumber && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-2">Shipping Information</h4>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Carrier:</span>
                              <span className="ml-2 font-medium">{order.carrier || 'Unknown'}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Tracking Number:</span>
                              <span className="ml-2 font-medium font-mono">{order.trackingNumber}</span>
                            </div>
                          </div>
                          <div className="mt-3">
                            <a
                              href={`https://www.${order.carrier?.toLowerCase()}.com/track?tracknum=${order.trackingNumber}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-[#173a6a] hover:text-[#1e4a7a] font-medium text-sm"
                            >
                              <Truck className="h-4 w-4" />
                              Track Package
                            </a>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Order Actions */}
                    <div className="mt-6 pt-6 border-t border-gray-200 flex flex-wrap gap-3">
                      <button className="inline-flex items-center gap-2 bg-[#173a6a] text-white px-4 py-2 rounded-lg hover:bg-[#1e4a7a] transition-colors">
                        <Eye className="h-4 w-4" />
                        View Details
                      </button>

                      {order.status === 'delivered' && (
                        <button className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                          <Download className="h-4 w-4" />
                          Download Invoice
                        </button>
                      )}

                      {order.status === 'pending' && (
                        <button className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors">
                          Cancel Order
                        </button>
                      )}

                      {(order.status === 'delivered' || order.status === 'shipped') && (
                        <button className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 transition-colors">
                          Reorder Items
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}