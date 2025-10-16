'use client';

import { useState } from 'react';
import { Tag, X, Check, AlertCircle, Loader2 } from 'lucide-react';

interface CouponInputProps {
  onCouponApplied?: (couponCode: string, discount: number) => void;
  onCouponRemoved?: () => void;
  appliedCoupon?: {
    code: string;
    discount: number;
    type: 'percentage' | 'fixed';
  } | null;
  className?: string;
  disabled?: boolean;
}

export default function CouponInput({
  onCouponApplied,
  onCouponRemoved,
  appliedCoupon = null,
  className = "",
  disabled = false
}: CouponInputProps) {
  const [couponCode, setCouponCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock coupon validation - in real app, this would call an API
  const validateCoupon = async (code: string): Promise<{ valid: boolean; discount?: number; type?: 'percentage' | 'fixed'; error?: string }> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock valid coupons for demonstration
    const validCoupons: Record<string, { discount: number; type: 'percentage' | 'fixed' }> = {
      'SAVE10': { discount: 10, type: 'percentage' },
      'WELCOME20': { discount: 20, type: 'fixed' },
      'HEALTHCARE15': { discount: 15, type: 'percentage' },
      'FIRSTORDER': { discount: 25, type: 'fixed' }
    };

    const coupon = validCoupons[code.toUpperCase()];
    if (coupon) {
      return { valid: true, ...coupon };
    }

    return { valid: false, error: 'Invalid coupon code' };
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || disabled) return;

    setIsApplying(true);
    setError(null);

    try {
      const result = await validateCoupon(couponCode.trim());

      if (result.valid && result.discount !== undefined) {
        onCouponApplied?.(couponCode.toUpperCase(), result.discount);
        setCouponCode('');
      } else {
        setError(result.error || 'Invalid coupon code');
      }
    } catch (error) {
      setError('Failed to validate coupon. Please try again.');
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemoveCoupon = () => {
    onCouponRemoved?.();
    setError(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyCoupon();
    }
  };

  if (appliedCoupon) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-900">
                Coupon Applied: {appliedCoupon.code}
              </p>
              <p className="text-sm text-green-700">
                {appliedCoupon.type === 'percentage'
                  ? `${appliedCoupon.discount}% discount applied`
                  : `$${appliedCoupon.discount} discount applied`
                }
              </p>
            </div>
          </div>
          <button
            onClick={handleRemoveCoupon}
            className="p-2 text-green-600 hover:bg-green-100 rounded-full transition-colors"
            title="Remove coupon"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            onKeyPress={handleKeyPress}
            placeholder="Enter coupon code"
            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#173a6a] focus:border-[#173a6a] transition-colors ${
              error ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={disabled || isApplying}
          />
        </div>
        <button
          onClick={handleApplyCoupon}
          disabled={!couponCode.trim() || disabled || isApplying}
          className="px-6 py-3 bg-[#173a6a] text-white rounded-lg hover:bg-[#1e4a7a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
        >
          {isApplying ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Applying...
            </>
          ) : (
            'Apply'
          )}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Coupon Suggestions */}
      <div className="text-sm text-gray-600">
        <p className="mb-2">Try these coupon codes:</p>
        <div className="flex flex-wrap gap-2">
          {['SAVE10', 'WELCOME20', 'HEALTHCARE15'].map((code) => (
            <button
              key={code}
              onClick={() => setCouponCode(code)}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors text-xs"
            >
              {code}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}