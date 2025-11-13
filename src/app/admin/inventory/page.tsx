'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface LowStockProduct {
  $id: string;
  name: string;
  currentStock: number;
  threshold: number;
  status: 'low' | 'critical' | 'out';
}

interface InventoryData {
  summary: {
    totalLowStock: number;
    outOfStock: number;
    critical: number;
    low: number;
  };
  products: {
    outOfStock: LowStockProduct[];
    critical: LowStockProduct[];
    low: LowStockProduct[];
  };
}

interface StockAdjustment {
  productId: string;
  variationId?: string;
  quantityChange: number;
  reason: string;
}

export default function InventoryManagementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [inventoryData, setInventoryData] = useState<InventoryData | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'adjust' | 'history'>('overview');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Stock adjustment form state
  const [adjustment, setAdjustment] = useState<StockAdjustment>({
    productId: '',
    quantityChange: 0,
    reason: ''
  });
  const [adjusting, setAdjusting] = useState(false);

  // Fetch inventory data
  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/inventory?action=overview');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch inventory data');
      }
      
      setInventoryData(result.data);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch inventory data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Handle stock adjustment
  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adjustment.productId || !adjustment.reason) {
      setError('Product ID and reason are required');
      return;
    }

    try {
      setAdjusting(true);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: adjustment.productId,
          variationId: adjustment.variationId || undefined,
          quantityChange: adjustment.quantityChange,
          reason: adjustment.reason,
          createdBy: 'admin' // TODO: Get from session
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to adjust stock');
      }

      setSuccessMessage('Stock adjusted successfully!');
      setAdjustment({
        productId: '',
        quantityChange: 0,
        reason: ''
      });
      
      // Refresh inventory data
      fetchInventory();
    } catch (err) {
      console.error('Error adjusting stock:', err);
      setError(err instanceof Error ? err.message : 'Failed to adjust stock');
    } finally {
      setAdjusting(false);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!inventoryData) return;

    const allProducts = [
      ...inventoryData.products.outOfStock,
      ...inventoryData.products.critical,
      ...inventoryData.products.low
    ];

    const csvContent = [
      ['Product ID', 'Product Name', 'Current Stock', 'Threshold', 'Status'].join(','),
      ...allProducts.map(p => [
        p.$id,
        `"${p.name}"`,
        p.currentStock,
        p.threshold,
        p.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render product table
  const renderProductTable = (products: LowStockProduct[], title: string, statusColor: string) => {
    if (products.length === 0) {
      return (
        <div className="p-4 text-center text-gray-500">
          No products in this category
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Threshold
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.$id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {product.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.currentStock}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.threshold}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}`}>
                    {product.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button
                    onClick={() => {
                      setAdjustment({
                        productId: product.$id,
                        quantityChange: 0,
                        reason: ''
                      });
                      setActiveTab('adjust');
                    }}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    Adjust
                  </button>
                  <button
                    onClick={() => router.push(`/admin/products?id=${product.$id}`)}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
        <p className="mt-2 text-sm text-gray-700">
          Monitor stock levels, adjust inventory, and view transaction history
        </p>
      </div>

      {/* Alert messages */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
          <button
            className="absolute top-0 right-0 px-4 py-3"
            onClick={() => setError(null)}
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded relative">
          <span className="block sm:inline">{successMessage}</span>
          <button
            className="absolute top-0 right-0 px-4 py-3"
            onClick={() => setSuccessMessage(null)}
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`${
              activeTab === 'overview'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('adjust')}
            className={`${
              activeTab === 'adjust'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Adjust Stock
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`${
              activeTab === 'history'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            History
          </button>
        </nav>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : activeTab === 'overview' && inventoryData ? (
        <div>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Out of Stock</dt>
                      <dd className="text-lg font-semibold text-gray-900">{inventoryData.summary.outOfStock}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-orange-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Critical</dt>
                      <dd className="text-lg font-semibold text-gray-900">{inventoryData.summary.critical}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Low Stock</dt>
                      <dd className="text-lg font-semibold text-gray-900">{inventoryData.summary.low}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Issues</dt>
                      <dd className="text-lg font-semibold text-gray-900">{inventoryData.summary.totalLowStock}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mb-6 flex justify-end space-x-3">
            <button
              onClick={exportToCSV}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
            <button
              onClick={() => fetchInventory()}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          {/* Product Tables */}
          <div className="space-y-6">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 bg-red-50">
                <h3 className="text-lg leading-6 font-medium text-red-900">
                  Out of Stock ({inventoryData.products.outOfStock.length})
                </h3>
              </div>
              {renderProductTable(inventoryData.products.outOfStock, 'Out of Stock', 'bg-red-100 text-red-800')}
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 bg-orange-50">
                <h3 className="text-lg leading-6 font-medium text-orange-900">
                  Critical Stock ({inventoryData.products.critical.length})
                </h3>
              </div>
              {renderProductTable(inventoryData.products.critical, 'Critical', 'bg-orange-100 text-orange-800')}
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 bg-yellow-50">
                <h3 className="text-lg leading-6 font-medium text-yellow-900">
                  Low Stock ({inventoryData.products.low.length})
                </h3>
              </div>
              {renderProductTable(inventoryData.products.low, 'Low Stock', 'bg-yellow-100 text-yellow-800')}
            </div>
          </div>
        </div>
      ) : activeTab === 'adjust' ? (
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Adjust Stock
            </h3>
            <form onSubmit={handleAdjustStock} className="space-y-4">
              <div>
                <label htmlFor="productId" className="block text-sm font-medium text-gray-700">
                  Product ID
                </label>
                <input
                  type="text"
                  id="productId"
                  value={adjustment.productId}
                  onChange={(e) => setAdjustment({ ...adjustment, productId: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="variationId" className="block text-sm font-medium text-gray-700">
                  Variation ID (optional)
                </label>
                <input
                  type="text"
                  id="variationId"
                  value={adjustment.variationId || ''}
                  onChange={(e) => setAdjustment({ ...adjustment, variationId: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="quantityChange" className="block text-sm font-medium text-gray-700">
                  Quantity Change (+ to add, - to remove)
                </label>
                <input
                  type="number"
                  id="quantityChange"
                  value={adjustment.quantityChange}
                  onChange={(e) => setAdjustment({ ...adjustment, quantityChange: parseInt(e.target.value) })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                  Reason
                </label>
                <textarea
                  id="reason"
                  rows={3}
                  value={adjustment.reason}
                  onChange={(e) => setAdjustment({ ...adjustment, reason: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={adjusting}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
                >
                  {adjusting ? 'Adjusting...' : 'Adjust Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow sm:rounded-lg p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Transaction History
          </h3>
          <p className="text-sm text-gray-500">
            Transaction history feature coming soon. This will show all inventory movements, including sales, returns, adjustments, and restocks.
          </p>
        </div>
      )}
    </div>
  );
}
