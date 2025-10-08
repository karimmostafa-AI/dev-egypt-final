'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import MainLayout from '../../components/MainLayout';
import { useCart } from '../../context/CartContext';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CartPage() {
  const router = useRouter();
  const { cart, removeFromCart, updateQuantity, getCartTotal, clearCart, getCartCount } = useCart();
  const [isClearing, setIsClearing] = useState(false);

  // Helper function to determine if media_id is a URL or Appwrite file ID
  const getImageSrc = (mediaId: string) => {
    // Check if it's a URL (starts with http:// or https://)
    if (mediaId.startsWith('http://') || mediaId.startsWith('https://')) {
      return mediaId;
    }
    // Otherwise, treat it as an Appwrite file ID
    return `/api/storage/files/${mediaId}/view`;
  };

  const handleClearCart = () => {
    if (confirm('Are you sure you want to clear your cart?')) {
      setIsClearing(true);
      clearCart();
      setTimeout(() => setIsClearing(false), 500);
    }
  };

  const handleCheckout = () => {
    router.push('/checkout');
  };

  const subtotal = getCartTotal();
  const shipping = cart.length > 0 ? 10 : 0; // $10 flat rate shipping
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shipping + tax;

  if (cart.length === 0) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-[1920px] mx-auto px-[50px]">
            <div className="text-center py-16">
              <ShoppingBag className="h-24 w-24 text-gray-300 mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Cart is Empty</h1>
              <p className="text-gray-600 mb-8">
                Looks like you haven't added any items to your cart yet.
              </p>
              <Link
                href="/catalog"
                className="inline-flex items-center gap-2 bg-[#173a6a] text-white px-8 py-3 rounded-md hover:bg-[#1e4a7a] transition-colors font-medium"
              >
                Continue Shopping
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-[1920px] mx-auto px-[50px]">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Shopping Cart</h1>
            <p className="text-gray-600">
              {getCartCount()} {getCartCount() === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm">
                {/* Cart Header */}
                <div className="p-6 border-b flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Cart Items</h2>
                  <button
                    onClick={handleClearCart}
                    disabled={isClearing}
                    className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
                  >
                    Clear Cart
                  </button>
                </div>

                {/* Cart Items List */}
                <div className="divide-y">
                  {cart.map((item) => {
                    const itemPrice = item.discount_price > 0 ? item.discount_price : item.price;
                    const itemTotal = itemPrice * item.quantity;

                    return (
                      <div key={`${item.$id}-${item.selectedSize}-${item.selectedColor}`} className="p-6">
                        <div className="flex gap-6">
                          {/* Product Image */}
                          <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                            {item.media_id ? (
                              <Image
                                src={getImageSrc(item.media_id)}
                                alt={item.name}
                                className="w-full h-full object-cover rounded-lg"
                                width={96}
                                height={96}
                                onError={(e) => {
                                  // Fallback to placeholder if image fails to load
                                  e.currentTarget.style.display = 'none';
                                  const fallbackIcon = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                                  if (fallbackIcon) {
                                    fallbackIcon.classList.remove('hidden');
                                  }
                                }}
                              />
                            ) : null}
                            {/* Fallback icon - shown if no media_id or image fails to load */}
                            <div className={`absolute inset-0 flex items-center justify-center text-gray-400 text-3xl fallback-icon ${item.media_id ? 'hidden' : ''}`}>
                              📦
                            </div>
                          </div>

                          {/* Product Details */}
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                            <p className="text-sm text-gray-600 mb-2">
                              SKU: {item.$id.substring(0, 8)}
                            </p>
                            {(item.selectedSize || item.selectedColor) && (
                              <div className="flex gap-4 text-sm text-gray-600 mb-3">
                                {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                                {item.selectedColor && <span>Color: {item.selectedColor}</span>}
                              </div>
                            )}

                            {/* Price and Quantity Controls */}
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  {item.discount_price > 0 && item.discount_price < item.price ? (
                                    <>
                                      <span className="text-lg font-bold text-red-600">
                                        ${itemPrice.toFixed(2)}
                                      </span>
                                      <span className="text-sm text-gray-500 line-through">
                                        ${item.price.toFixed(2)}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-lg font-bold text-gray-900">
                                      ${itemPrice.toFixed(2)}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                  Total: ${itemTotal.toFixed(2)}
                                </p>
                              </div>

                              <div className="flex items-center gap-4">
                                {/* Quantity Controls */}
                                <div className="flex items-center border border-gray-300 rounded-md">
                                  <button
                                    onClick={() => updateQuantity(item.$id, item.quantity - 1)}
                                    className="p-2 hover:bg-gray-100 transition-colors"
                                    aria-label="Decrease quantity"
                                  >
                                    <Minus className="h-4 w-4" />
                                  </button>
                                  <span className="px-4 py-2 font-medium min-w-[3rem] text-center">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() => updateQuantity(item.$id, item.quantity + 1)}
                                    className="p-2 hover:bg-gray-100 transition-colors"
                                    aria-label="Increase quantity"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </button>
                                </div>

                                {/* Remove Button */}
                                <button
                                  onClick={() => removeFromCart(item.$id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                  aria-label="Remove item"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Continue Shopping Link */}
              <Link
                href="/catalog"
                className="inline-flex items-center gap-2 text-[#173a6a] hover:text-[#1e4a7a] font-medium mt-6 transition-colors"
              >
                ← Continue Shopping
              </Link>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({getCartCount()} items)</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className="font-medium">${shipping.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax (8%)</span>
                    <span className="font-medium">${tax.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-bold text-gray-900">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full bg-[#173a6a] text-white py-4 px-6 rounded-md hover:bg-[#1e4a7a] transition-colors font-medium text-lg flex items-center justify-center gap-2"
                >
                  Proceed to Checkout
                  <ArrowRight className="h-5 w-5" />
                </button>

                {/* Trust Signals */}
                <div className="mt-6 pt-6 border-t space-y-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span>✓</span>
                    <span>Secure checkout</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>✓</span>
                    <span>Free returns within 30 days</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>✓</span>
                    <span>Fast & reliable shipping</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
