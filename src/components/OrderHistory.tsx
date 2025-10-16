'use client';

import { useState } from 'react';
import { Package, Truck, CheckCircle, XCircle, Clock, Eye, Download, RefreshCw, Search, Filter } from 'lucide-react';
import { Order } from '../types/admin';

interface OrderWithCustomer extends Order {
  customerName?: string;
  customerEmail?: string;
}

interface OrderHistoryProps {
  orders: OrderWithCustomer[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  showCustomerInfo?: boolean;
  maxItems?: number;
  showFilters?: boolean;
  className?: string;
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

export default function OrderHistory({
  orders,
  loading = false,
  error = null,
  onRetry,
  showCustomerInfo = false,
  maxItems,
  showFilters = true,
  className = ""
}: OrderHistoryProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = orders.filter(order => {
    // Status filter
    if (selectedStatus !== 'all' && order.status !== selectedStatus) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const searchText = `${order.orderNumber} ${order.customerName || ''} ${order.customerEmail || ''}`.toLowerCase();
      if (!searchText.includes(query)) {
        return false;
      }
    }

    return true;
  });

  const displayedOrders = maxItems ? filteredOrders.slice(0, maxItems) : filteredOrders;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border p-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 bg-gray-200 rounded w-48"></div>
              <div className="h-6 bg-gray-200 rounded w-20"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-red-400 text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Orders</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 bg-[#173a6a] text-white px-4 py-2 rounded-lg hover:bg-[#1e4a7a] transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Filters */}
      {showFilters && orders.length > 0 && (
        <div className="bg-white rounded-lg border p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search orders by number, customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#173a6a] focus:border-[#173a6a]"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#173a6a] focus:border-[#173a6a]"
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
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Showing {displayedOrders.length} of {orders.length} orders
          </div>
        </div>
      )}

      {/* Orders List */}
      {displayedOrders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {orders.length === 0 ? 'No orders found' : 'No orders match your filters'}
          </h3>
          <p className="text-gray-600">
            {orders.length === 0
              ? "You haven't placed any orders yet."
              : "Try adjusting your search or filter criteria."
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedOrders.map((order) => (
            <div key={order.$id} className="bg-white rounded-lg border overflow-hidden hover:shadow-md transition-shadow">
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
                      {showCustomerInfo && (order.customerName || order.customerEmail) && (
                        <p className="text-sm text-gray-600">
                          {order.customerName && `${order.customerName}`}
                          {order.customerName && order.customerEmail && ' • '}
                          {order.customerEmail}
                        </p>
                      )}
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

              {/* Order Items Preview */}
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  {order.items.slice(0, 3).map((item, index) => (
                    <div key={index} className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-600">
                      {item.productImage ? (
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        '📦'
                      )}
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-600">
                      +{order.items.length - 3}
                    </div>
                  )}
                </div>

                {/* Order Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="ml-2 font-medium">{formatCurrency(order.subtotal)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Shipping:</span>
                    <span className="ml-2 font-medium">
                      {order.shippingCost === 0 ? 'FREE' : formatCurrency(order.shippingCost)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Tax:</span>
                    <span className="ml-2 font-medium">{formatCurrency(order.taxAmount)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total:</span>
                    <span className="ml-2 font-bold text-[#173a6a]">{formatCurrency(order.total)}</span>
                  </div>
                </div>

                {/* Shipping Information */}
                {(order.status === 'shipped' || order.status === 'delivered') && order.trackingNumber && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <span className="text-gray-600">Carrier:</span>
                        <span className="ml-2 font-medium">{order.carrier || 'Unknown'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Tracking:</span>
                        <span className="ml-2 font-mono text-[#173a6a]">{order.trackingNumber}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Order Actions */}
                <div className="mt-6 pt-4 border-t border-gray-200 flex flex-wrap gap-3">
                  <button className="inline-flex items-center gap-2 bg-[#173a6a] text-white px-4 py-2 rounded-lg hover:bg-[#1e4a7a] transition-colors">
                    <Eye className="h-4 w-4" />
                    View Details
                  </button>

                  {order.status === 'delivered' && (
                    <button className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                      <Download className="h-4 w-4" />
                      Invoice
                    </button>
                  )}

                  {(order.status === 'delivered' || order.status === 'shipped') && (
                    <button className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 transition-colors">
                      Reorder
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}