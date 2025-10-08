# Checkout Form with Appwrite Orders Collection

## Overview
This implementation provides a complete checkout form that integrates with an Appwrite orders collection to store order data.

## Features Implemented

### 1. Checkout Form (`/src/app/checkout/page.tsx`)
- **Multi-step checkout process** with clear visual indicators
- **Form validation** using React Hook Form and Zod schema
- **Responsive design** with mobile-friendly layout
- **Customer information** collection (email, name, phone)
- **Shipping and billing addresses** with option to use same address
- **Payment method selection** (Credit Card, PayPal, Apple Pay)
- **Order summary** with cart items and totals calculation
- **Order confirmation** screen after successful submission

### 2. Orders API Integration (`/src/app/api/orders/route.ts`)
- **POST endpoint** for creating new orders
- **Appwrite database integration** using server-side SDK
- **Order data validation** and processing
- **Automatic order number generation**
- **Support for both authenticated and guest users**

### 3. Appwrite Orders Collection Schema

The orders collection should have the following attributes in Appwrite:

#### Required Attributes:
```json
{
  "orderNumber": {
    "type": "string",
    "size": 50,
    "required": true
  },
  "customerId": {
    "type": "string",
    "size": 50,
    "required": true
  },
  "items": {
    "type": "string",
    "size": 65535,
    "required": true,
    "note": "JSON array of order items"
  },
  "subtotal": {
    "type": "double",
    "required": true
  },
  "shippingCost": {
    "type": "double",
    "required": true
  },
  "taxAmount": {
    "type": "double",
    "required": true
  },
  "discountAmount": {
    "type": "double",
    "required": true
  },
  "total": {
    "type": "double",
    "required": true
  },
  "status": {
    "type": "enum",
    "elements": ["pending", "processing", "shipped", "delivered", "cancelled", "refunded"],
    "required": true
  },
  "paymentStatus": {
    "type": "enum",
    "elements": ["pending", "paid", "failed", "refunded"],
    "required": true
  },
  "fulfillmentStatus": {
    "type": "enum",
    "elements": ["unfulfilled", "partial", "fulfilled", "cancelled"],
    "required": true
  },
  "paymentMethod": {
    "type": "string",
    "size": 50,
    "required": true
  },
  "shippingAddress": {
    "type": "string",
    "size": 65535,
    "required": true,
    "note": "JSON object with address details"
  },
  "billingAddress": {
    "type": "string",
    "size": 65535,
    "required": true,
    "note": "JSON object with address details"
  },
  "customerNote": {
    "type": "string",
    "size": 1000,
    "required": false
  },
  "internalNotes": {
    "type": "string",
    "size": 65535,
    "required": false,
    "note": "JSON array of internal notes"
  },
  "timeline": {
    "type": "string",
    "size": 65535,
    "required": true,
    "note": "JSON array of status changes"
  },
  "transactionId": {
    "type": "string",
    "size": 100,
    "required": false
  },
  "trackingNumber": {
    "type": "string",
    "size": 100,
    "required": false
  },
  "carrier": {
    "type": "string",
    "size": 50,
    "required": false
  },
  "shippedAt": {
    "type": "datetime",
    "required": false
  },
  "deliveredAt": {
    "type": "datetime",
    "required": false
  }
}
```

## Setup Instructions

### 1. Create Orders Collection in Appwrite

1. **Login to Appwrite Console**
   - Navigate to your Appwrite project
   - Go to "Databases" section

2. **Create Collection**
   - Click "Create Collection"
   - Name: `orders`
   - Collection ID: `orders` (or update `ORDERS_COLLECTION_ID` in your environment)

3. **Add Attributes**
   - Add each attribute from the schema above
   - Set appropriate permissions for read/write access

### 2. Environment Variables

Ensure these environment variables are set in your `.env.local`:

```env
# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your-database-id
NEXT_PUBLIC_APPWRITE_ORDERS_COLLECTION_ID=orders

# Server API Key (required for creating orders)
APPWRITE_API_KEY=your-api-key
```

### 3. API Key Permissions

Your Appwrite API key needs these permissions:
- `databases.read`
- `databases.write`
- `documents.read`
- `documents.write`

## Usage Flow

1. **Customer adds items to cart** (existing cart functionality)
2. **Customer navigates to checkout** from cart page
3. **Customer fills out checkout form**:
   - Personal information
   - Shipping address
   - Billing address (or same as shipping)
   - Payment method selection
   - Order notes (optional)
4. **Form validation** ensures all required fields are completed
5. **Order submission** creates order in Appwrite database
6. **Order confirmation** displays success message and order number
7. **Cart is cleared** after successful order

## Integration Points

### Cart Integration
- Checkout form reads cart data from `CartContext`
- Order items are mapped from cart items to order format
- Cart is cleared after successful order placement

### Authentication Integration
- Supports both authenticated and guest users
- Guest users can place orders without registration
- Authenticated users have their user ID stored with the order

### Payment Integration
- Currently collects payment method selection
- Ready for integration with payment processors (Stripe, PayPal, etc.)
- Payment status tracking in order timeline

## Order Management

The order service (`/src/lib/order-service.ts`) provides methods for:
- Creating orders
- Updating order status
- Managing payment status
- Tracking fulfillment
- Adding internal notes
- Generating order statistics

## Security Considerations

- **Server-side validation** of all order data
- **API key protection** using environment variables
- **Input sanitization** and validation using Zod schemas
- **Guest user support** without exposing sensitive data

## Future Enhancements

1. **Payment Processing Integration**
   - Stripe, PayPal, or other payment gateways
   - Real-time payment status updates

2. **Order Tracking**
   - Customer order history page
   - Real-time order status updates
   - Email notifications

3. **Inventory Management**
   - Stock validation during checkout
   - Automatic inventory updates

4. **Advanced Features**
   - Discount codes and coupons
   - Multiple shipping options
   - Tax calculation by location
   - Order modifications and cancellations

## Testing

To test the checkout flow:

1. Add items to cart from the catalog
2. Navigate to `/cart` and click "Proceed to Checkout"
3. Fill out the checkout form with test data
4. Submit the order
5. Verify order creation in Appwrite Console
6. Check order confirmation screen

## Troubleshooting

### Common Issues:

1. **"Failed to create order" error**
   - Check Appwrite API key permissions
   - Verify collection exists and has correct attributes
   - Check server logs for detailed error messages

2. **Form validation errors**
   - Ensure all required fields are filled
   - Check email format and phone number length
   - Verify address fields are complete

3. **Cart is empty on checkout**
   - Ensure items are added to cart first
   - Check localStorage for cart data
   - Verify cart context is properly initialized

This implementation provides a solid foundation for e-commerce checkout functionality with Appwrite as the backend database.
