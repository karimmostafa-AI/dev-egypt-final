'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import MainLayout from '../../components/MainLayout';
import { useCart } from '../../context/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ArrowLeft, CreditCard, Truck, Shield, CheckCircle, User, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import AddressForm from '../../components/AddressForm';

// Form validation schema
const checkoutSchema = z.object({
  // Customer Information
  email: z.string().email('Please enter a valid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().min(10, 'Please enter a valid phone number'),

  // Shipping Address
  shippingAddress: z.object({
    addressLine1: z.string().min(1, 'Address is required'),
    addressLine2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    postalCode: z.string().min(5, 'Please enter a valid postal code'),
    country: z.string().min(1, 'Country is required'),
  }),

  // Billing Address - optional when sameAsBilling is true
  billingAddress: z.object({
    addressLine1: z.string(),
    addressLine2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string(),
  }),

  // Payment
  paymentMethod: z.literal('cash_on_delivery'),

  // Options
  sameAsBilling: z.boolean().default(false),
  customerNote: z.string().optional(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions',
  }),
}).refine(
  (data) => {
    // If sameAsBilling is false, validate billing address fields
    if (!data.sameAsBilling) {
      return (
        data.billingAddress.addressLine1.length > 0 &&
        data.billingAddress.city.length > 0 &&
        data.billingAddress.state.length > 0 &&
        data.billingAddress.postalCode.length >= 5 &&
        data.billingAddress.country.length > 0
      );
    }
    return true;
  },
  {
    message: 'Please fill in all required billing address fields',
    path: ['billingAddress'],
  }
);

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, getCartTotal, getCartCount, clearCart } = useCart();
  const { auth } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState<string>('');
  const [orderCode, setOrderCode] = useState<string>('');

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema) as any,
    mode: 'onChange', // Validate on change
    reValidateMode: 'onChange', // Re-validate on change
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      shippingAddress: {
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'United States',
      },
      billingAddress: {
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'United States',
      },
      paymentMethod: 'cash_on_delivery',
      sameAsBilling: false,
      customerNote: '',
      acceptTerms: false,
    },
  });

  const watchSameAsBilling = form.watch('sameAsBilling');

  // Calculate totals
  const subtotal = getCartTotal();
  const shipping = cart.length > 0 ? 10 : 0;
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shipping + tax;

  // AUTHENTICATION GUARD: Redirect to login if not authenticated
  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      // Store current page as redirect target
      router.push('/login?redirect=/checkout');
    }
  }, [auth.isLoading, auth.isAuthenticated, router]);

  // Helper function to determine if media_id is a URL or file ID
  const getImageSrc = (mediaId: string) => {
    // Check if it's a URL (starts with http:// or https://)
    if (mediaId.startsWith('http://') || mediaId.startsWith('https://')) {
      return mediaId;
    }
    // Otherwise, treat it as a file ID in the public directory
    return `/uploads/images/${mediaId}`;
  };

  // NOW CONDITIONAL RETURNS ARE SAFE
  // Show loading while checking authentication
  if (auth.isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#173a6a] mx-auto mb-4"></div>
            <p className="text-gray-600">Checking authentication...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Don't render checkout if not authenticated
  if (!auth.isAuthenticated) {
    return null;
  }

  // Redirect if cart is empty
  if (cart.length === 0 && !orderComplete) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
            <p className="text-gray-600 mb-6">Add some items to your cart before checking out.</p>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 bg-[#173a6a] text-white px-6 py-3 rounded-md hover:bg-[#1e4a7a] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Continue Shopping
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  const onSubmit = async (data: CheckoutFormData) => {
    console.log('\ud83d\udc40 Form submitted!', data);
    console.log('\ud83d\udc64 Auth user:', auth.user);
    console.log('\ud83d\udce6 Same as billing:', data.sameAsBilling);
    
    // Ensure user is authenticated (use .id property from auth.user)
    const userId = auth.user?.id || auth.user?.$id;
    if (!userId) {
      console.error('\u274c User not authenticated');
      toast.error('You must be logged in to place an order');
      router.push('/login?redirect=/checkout');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('🛒 Starting order submission for user:', userId);

      // Use shipping address for billing if sameAsBilling is checked
      const billingAddressData = data.sameAsBilling 
        ? data.shippingAddress 
        : data.billingAddress;

      console.log('📦 Using billing address:', billingAddressData);

      // Extract brand_id from first cart item (orders can contain products from multiple brands)
      // If you need to filter by all brands in an order, consider storing all brand_ids
      const brand_id = cart.length > 0 ? cart[0].brand_id : '';
      console.log('🏷️ Order brand_id:', brand_id);

      // Prepare order input for OrderRepository
      const orderInput = {
        customer_id: userId,
        email: data.email,
        brand_id, // Include brand_id for admin filtering
        items: cart.map(item => ({
          productId: item.$id,
          name: item.name,
          sku: (item as any).sku || item.$id.substring(0, 8),
          quantity: item.quantity,
          price: item.discount_price > 0 ? item.discount_price : item.price,
          brand_id: item.brand_id, // Also store brand per item
        })),
        shippingAddress: {
          fullName: `${data.firstName} ${data.lastName}`,
          addressLine1: data.shippingAddress.addressLine1,
          addressLine2: data.shippingAddress.addressLine2,
          city: data.shippingAddress.city,
          state: data.shippingAddress.state,
          postalCode: data.shippingAddress.postalCode,
          country: data.shippingAddress.country,
          phone: data.phone,
        },
        billingAddress: {
          fullName: `${data.firstName} ${data.lastName}`,
          addressLine1: billingAddressData.addressLine1,
          addressLine2: billingAddressData.addressLine2,
          city: billingAddressData.city,
          state: billingAddressData.state,
          postalCode: billingAddressData.postalCode,
          country: billingAddressData.country,
          phone: data.phone,
        },
        paymentMethod: data.paymentMethod,
        subtotal: subtotal,
        shippingCost: shipping,
        taxAmount: tax,
        discountAmount: 0,
        customerNote: data.customerNote,
      };

      console.log('📝 Order input prepared, submitting to server...');

      // Create order via server-side API route
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderInput),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create order');
      }

      const { order } = await response.json();
      console.log('✅ Order created successfully:', order.id);
      console.log('🏷️ Order code for tracking:', order.order_code);

      // Set order details for confirmation screen
      setOrderId(order.id || order.$id || '');
      setOrderCode(order.order_code);
      setOrderComplete(true);
      clearCart();
      toast.success('Order placed successfully!');
    } catch (error) {
      console.error('❌ Error placing order:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Order confirmation screen
  if (orderComplete) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-2xl mx-auto px-4">
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Confirmed!</h1>
                <p className="text-gray-600 mb-6">
                  Thank you for your order. We've received your order and will process it shortly. You'll pay with cash when your order is delivered.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600">Order Number</p>
                  <p className="text-lg font-mono font-bold text-gray-900">{orderCode || orderId}</p>
                  <p className="text-xs text-gray-500 mt-2">ID: {orderId}</p>
                </div>
                <div className="space-y-3">
                  <Button 
                    onClick={() => router.push('/catalog')} 
                    className="w-full"
                  >
                    Continue Shopping
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => router.push('/account/orders')} 
                    className="w-full"
                  >
                    View Order Status
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/cart"
              className="inline-flex items-center gap-2 text-[#173a6a] hover:text-[#1e4a7a] font-medium mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Cart
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
            <p className="text-gray-600 mt-2">
              Complete your order - You're signed in as{' '}
              <span className="font-medium text-gray-900">{auth.user?.email || 'Customer'}</span>
            </p>
          </div>

          <Form {...form}>
            <form 
              onSubmit={(e) => {
                console.log('\ud83d\udc49 Form submit event triggered');
                console.log('\ud83d\udcdd Form errors:', form.formState.errors);
                console.log('\u2705 Form is valid:', form.formState.isValid);
                console.log('\ud83d\udce6 Form values:', form.getValues());
                
                // Show which fields are invalid
                const errors = form.formState.errors;
                if (Object.keys(errors).length > 0) {
                  console.error('\u274c Invalid fields:', Object.keys(errors));
                  Object.entries(errors).forEach(([field, error]: [string, any]) => {
                    console.error(`  - ${field}:`, error?.message || error);
                  });
                }
                
                form.handleSubmit(onSubmit)(e);
              }} 
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Main Form */}
              <div className="lg:col-span-2 space-y-8">
                {/* Customer Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="bg-[#173a6a] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
                      Customer Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input placeholder="your@email.com" {...field} />
                          </FormControl>
                          <p className="text-xs text-gray-600 mt-1">
                            We'll send order confirmation and updates to this email
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="(555) 123-4567" {...field} />
                          </FormControl>
                          <p className="text-xs text-gray-600 mt-1">
                            For delivery updates and support
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Shipping Address */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="bg-[#173a6a] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                      <Truck className="h-5 w-5" />
                      Shipping Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AddressForm
                      form={form}
                      addressType="shipping"
                      className="space-y-4"
                    />
                  </CardContent>
                </Card>

                {/* Billing Address */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="bg-[#173a6a] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
                      Billing Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AddressForm
                      form={form}
                      addressType="billing"
                      sameAsShipping={watchSameAsBilling}
                      onSameAsShippingChange={(checked) => form.setValue('sameAsBilling', checked)}
                      showSameAsShipping={true}
                      className="space-y-4"
                    />
                  </CardContent>
                </Card>

                {/* Payment Method */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="bg-[#173a6a] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">4</span>
                      <Truck className="h-5 w-5" />
                      Payment Method
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-green-600 text-lg">💵</span>
                        </div>
                        <div>
                          <p className="font-medium text-green-900">Cash on Delivery</p>
                          <p className="text-sm text-green-700">
                            Pay with cash when your order is delivered to your doorstep
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Additional Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="customerNote"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Order Notes (Optional)</FormLabel>
                          <FormControl>
                            <textarea
                              className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#173a6a] focus:border-transparent"
                              placeholder="Special delivery instructions, gift message, etc."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Terms and Conditions */}
                <Card>
                  <CardContent className="pt-6">
                    <FormField
                      control={form.control}
                      name="acceptTerms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              I agree to the{' '}
                              <Link href="/terms" className="text-[#173a6a] hover:underline">
                                Terms and Conditions
                              </Link>{' '}
                              and{' '}
                              <Link href="/privacy" className="text-[#173a6a] hover:underline">
                                Privacy Policy
                              </Link>
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Order Summary Sidebar */}
              <div className="lg:col-span-1">
                <Card className="sticky top-8">
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Cart Items */}
                    <div className="space-y-3">
                      {cart.map((item) => {
                        const itemPrice = item.discount_price > 0 ? item.discount_price : item.price;
                        const itemTotal = itemPrice * item.quantity;

                        return (
                          <div key={`${item.$id}-${item.selectedSize}-${item.selectedColor}`} className="flex gap-3">
                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                              {item.media_id ? (
                                <Image
                                  src={getImageSrc(item.media_id)}
                                  alt={item.name}
                                  className="w-full h-full object-cover rounded-lg"
                                  width={64}
                                  height={64}
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
                              <div className={`absolute inset-0 flex items-center justify-center text-gray-400 text-2xl fallback-icon ${item.media_id ? 'hidden' : ''}`}>
                                📦
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm text-gray-900 truncate">{item.name}</h4>
                              <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                              {(item.selectedSize || item.selectedColor) && (
                                <p className="text-xs text-gray-600">
                                  {item.selectedSize && `Size: ${item.selectedSize}`}
                                  {item.selectedSize && item.selectedColor && ', '}
                                  {item.selectedColor && `Color: ${item.selectedColor}`}
                                </p>
                              )}
                              <p className="text-sm font-medium text-gray-900">${itemTotal.toFixed(2)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <Separator />

                    {/* Totals */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal ({getCartCount()} items)</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Shipping</span>
                        <span>${shipping.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tax</span>
                        <span>${tax.toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Place Order Button */}
                    <Button
                      type="submit"
                      className="w-full bg-[#173a6a] hover:bg-[#1e4a7a] text-white py-3 text-lg"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Processing...' : `Place Order - $${total.toFixed(2)}`}
                    </Button>

                    {/* Security Badge */}
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600 pt-4">
                      <Shield className="h-4 w-4" />
                      <span>Secure SSL Checkout</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </MainLayout>
  );
}
