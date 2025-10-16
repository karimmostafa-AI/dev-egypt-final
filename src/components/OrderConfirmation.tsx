'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle, Package, Truck, Clock, Download, Share2, Mail, ArrowRight, Copy, ExternalLink } from 'lucide-react';
import { Order } from '../types/admin';

interface OrderConfirmationProps {
  order: {
    $id: string;
    orderNumber: string;
    total: number;
    items: Array<{
      productId: string;
      productName: string;
      productImage?: string;
      sku: string;
      quantity: number;
      price: number;
      total: number;
    }>;
    status: string;
    shippingAddress: {
      fullName: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    trackingNumber?: string;
    carrier?: string;
    estimatedDelivery?: string;
  };
  showActions?: boolean;
  showOrderDetails?: boolean;
  className?: string;
}

export default function OrderConfirmation({
  order,
  showActions = true,
  showOrderDetails = true,
  className = ""
}: OrderConfirmationProps) {
  const [copied, setCopied] = useState(false);

  const copyOrderNumber = async () => {
    try {
      await navigator.clipboard.writeText(order.orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy order number:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const shareOrder = async () => {
    const shareData = {
      title: 'Order Confirmation',
      text: `My order ${order.orderNumber} has been confirmed! Total: ${formatCurrency(order.total)}`,
      url: `${window.location.origin}/account/orders`
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  return (
    <div className={`bg-white rounded-lg border ${className}`}>
      {/* Success Header */}
      <div className="bg-green-50 border-b border-green-200 p-6 text-center">
        <div className="max-w-md mx-auto">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h2>
          <p className="text-green-700 mb-4">
            Thank you for your order! We've received it and will process it shortly.
          </p>

          {/* Order Number */}
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <p className="text-sm text-gray-600 mb-1">Order Number</p>
            <div className="flex items-center justify-center gap-2">
              <p className="text-lg font-mono font-bold text-gray-900">{order.orderNumber}</p>
              <button
                onClick={copyOrderNumber}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Copy order number"
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4 text-gray-600" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Order Status Timeline */}
        <div className="mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">Order Status</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Order Confirmed</p>
                <p className="text-sm text-gray-600">Your order has been received</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <Package className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Processing</p>
                <p className="text-sm text-gray-600">Preparing your items</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <Truck className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Shipped</p>
                <p className="text-sm text-gray-600">On its way to you</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Delivered</p>
                <p className="text-sm text-gray-600">Package received</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        {showOrderDetails && (
          <div className="mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-lg border flex items-center justify-center flex-shrink-0">
                      {item.productImage ? (
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Package className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.productName}</h4>
                      <p className="text-sm text-gray-600">SKU: {item.sku} • Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(item.total)}</p>
                      <p className="text-sm text-gray-600">{formatCurrency(item.price)} each</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Total */}
              <div className="border-t border-gray-200 mt-4 pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Order Total:</span>
                  <span className="text-[#173a6a]">{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Shipping Information */}
        {order.trackingNumber && (
          <div className="mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">Shipping Information</h3>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Carrier</p>
                  <p className="font-medium text-gray-900">{order.carrier || 'Standard Shipping'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tracking Number</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-gray-900">{order.trackingNumber}</p>
                    <button className="p-1 hover:bg-blue-100 rounded transition-colors">
                      <ExternalLink className="h-4 w-4 text-blue-600" />
                    </button>
                  </div>
                </div>
              </div>
              {order.estimatedDelivery && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="text-sm text-gray-600">Estimated Delivery</p>
                  <p className="font-medium text-gray-900">{order.estimatedDelivery}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Shipping Address */}
        <div className="mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">Shipping Address</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="font-medium text-gray-900">{order.shippingAddress.fullName}</p>
            <p className="text-gray-600">{order.shippingAddress.addressLine1}</p>
            {order.shippingAddress.addressLine2 && (
              <p className="text-gray-600">{order.shippingAddress.addressLine2}</p>
            )}
            <p className="text-gray-600">
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
            </p>
            <p className="text-gray-600">{order.shippingAddress.country}</p>
          </div>
        </div>

        {/* What's Next */}
        <div className="mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">What's Next?</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#173a6a] text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                1
              </div>
              <div>
                <p className="font-medium text-gray-900">Order Processing</p>
                <p className="text-sm text-gray-600">We'll prepare your items for shipment (1-2 business days)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                2
              </div>
              <div>
                <p className="font-medium text-gray-900">Shipping</p>
                <p className="text-sm text-gray-600">Your order will be shipped and you'll receive a tracking number</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                3
              </div>
              <div>
                <p className="font-medium text-gray-900">Delivery</p>
                <p className="text-sm text-gray-600">Receive your order and enjoy your new scrubs!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/catalog"
                className="bg-[#173a6a] text-white px-6 py-3 rounded-lg hover:bg-[#1e4a7a] transition-colors font-medium text-center flex items-center justify-center gap-2"
              >
                Continue Shopping
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/account/orders"
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium text-center"
              >
                View Order History
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button className="flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                <Download className="h-4 w-4" />
                Download Invoice
              </button>

              <button
                onClick={shareOrder}
                className="flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Share2 className="h-4 w-4" />
                Share Order
              </button>

              <Link
                href="/contact"
                className="flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Mail className="h-4 w-4" />
                Need Help?
              </Link>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <h4 className="font-medium text-gray-900 mb-2">Questions about your order?</h4>
            <p className="text-sm text-gray-600 mb-3">
              Our customer service team is here to help with any questions or concerns.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 text-[#173a6a] hover:text-[#1e4a7a] font-medium text-sm"
            >
              Contact Support →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}