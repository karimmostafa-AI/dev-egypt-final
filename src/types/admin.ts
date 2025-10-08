// Admin System TypeScript Types
// Based on PRD specifications

// Product Types
export interface Product {
  $id: string;
  $createdAt: string;
  $updatedAt: string;

  // Basic Information
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;

  // Pricing
  price: number;
  compareAtPrice?: number;
  costPerItem?: number;

  // Inventory
  sku: string;
  stockQuantity: number;
  lowStockThreshold: number;
  trackInventory: boolean;

  // Organization
  categoryId: string;
  tags: string[];
  status: 'draft' | 'active' | 'archived';

  // Media
  images: ProductImage[];
  featuredImageId?: string;

  // SEO
  seoTitle?: string;
  seoDescription?: string;

  // Metadata
  viewCount: number;
  salesCount: number;
}

export interface ProductImage {
  $id: string;
  url: string;
  thumbnailUrl: string;
  alt: string;
  position: number;
}

// Category Types
export interface Category {
  $id: string;
  $createdAt: string;
  $updatedAt: string;

  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  imageId?: string;
  imageUrl?: string;
  position: number;
  status: 'active' | 'inactive';
  productCount: number;
}

// Order Types
export interface Order {
  $id: string;
  $createdAt: string;
  $updatedAt: string;

  // Order Information
  orderNumber: string;
  customerId: string;

  // Items
  items: OrderItem[];

  // Totals
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  discountAmount: number;
  total: number;

  // Status
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  fulfillmentStatus: 'unfulfilled' | 'partial' | 'fulfilled' | 'cancelled';

  // Payment
  paymentMethod: string;
  transactionId?: string;

  // Addresses
  shippingAddress: Address;
  billingAddress: Address;

  // Shipping
  trackingNumber?: string;
  carrier?: string;
  shippedAt?: string;
  deliveredAt?: string;

  // Notes
  customerNote?: string;
  internalNotes: OrderNote[];

  // Timeline
  timeline: OrderStatusChange[];
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage?: string;
  sku: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Address {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface OrderNote {
  $id: string;
  note: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface OrderStatusChange {
  status: string;
  changedBy: string;
  changedAt: string;
  note?: string;
}

// Customer Types
export interface Customer {
  $id: string;
  $createdAt: string;
  $updatedAt: string;

  // Basic Information
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;

  // Addresses
  addresses: Address[];
  defaultShippingAddressId?: string;
  defaultBillingAddressId?: string;

  // Statistics
  ordersCount: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate?: string;

  // Account
  status: 'active' | 'blocked';
  emailVerified: boolean;

  // Segmentation
  tags: string[];
  segment?: 'vip' | 'regular' | 'at-risk' | 'inactive';

  // Marketing
  acceptsMarketing: boolean;

  // Notes
  notes: CustomerNote[];
}

export interface CustomerNote {
  $id: string;
  note: string;
  userId: string;
  userName: string;
  createdAt: string;
}

// Settings Types
export interface StoreSettings {
  $id: string;
  $updatedAt: string;

  // Store Information
  storeName: string;
  storeLogoId?: string;
  contactEmail: string;
  contactPhone: string;
  storeAddress: Address;

  // Regional
  currency: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';

  // Notifications
  lowStockThreshold: number;
  enableLowStockAlerts: boolean;
  enableNewOrderNotifications: boolean;
  enableCustomerRegistrationNotifications: boolean;
  notificationEmails: string[];
}

export interface PaymentSettings {
  $id: string;
  enabledMethods: string[];
  testMode: boolean;
}

export interface ShippingSettings {
  $id: string;
  zones: ShippingZone[];
  freeShippingThreshold?: number;
  handlingTime: number; // in days
}

export interface ShippingZone {
  $id: string;
  name: string;
  countries: string[];
  rates: ShippingRate[];
}

export interface ShippingRate {
  $id: string;
  name: string;
  price: number;
  minOrderValue?: number;
  maxOrderValue?: number;
}

export interface TaxSettings {
  $id: string;
  taxInclusivePricing: boolean;
  automaticTaxCalculation: boolean;
  rates: TaxRate[];
}

export interface TaxRate {
  $id: string;
  region: string;
  rate: number; // percentage
}

export interface EmailSettings {
  $id: string;
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string; // encrypted
  fromEmail: string;
  fromName: string;
  templates: EmailTemplate[];
}

export interface EmailTemplate {
  type: 'order_confirmation' | 'shipping_notification' | 'delivery_notification' | 'refund_notification';
  subject: string;
  body: string; // HTML template
  enabled: boolean;
}

// User Types (Admin Users)
export interface AdminUser {
  $id: string;
  $createdAt: string;
  $updatedAt: string;

  email: string;
  name: string;
  role: 'admin' | 'manager' | 'staff';
  permissions: Permission[];
  status: 'active' | 'inactive';
  lastLoginAt?: string;
}

export interface Permission {
  resource: 'products' | 'orders' | 'customers' | 'settings' | 'analytics';
  actions: ('view' | 'create' | 'update' | 'delete')[];
}

// Dashboard Types
export interface DashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  revenueChange: number;
  ordersChange: number;
  customersChange: number;
  aovChange: number;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface RecentOrder {
  $id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: Order['status'];
  createdAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  documents: T[];
  total: number;
  limit: number;
  offset: number;
}

// Form Types
export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  costPerItem?: number;
  sku: string;
  stockQuantity: number;
  lowStockThreshold: number;
  categoryId: string;
  tags: string[];
  status: 'draft' | 'active';
  images: File[];
  seoTitle?: string;
  seoDescription?: string;
}

export interface CategoryFormData {
  name: string;
  description?: string;
  parentId?: string;
  image?: File;
  status: 'active' | 'inactive';
}

// Filter and Search Types
export interface ProductFilters {
  search?: string;
  category?: string;
  status?: Product['status'];
  stockStatus?: 'in-stock' | 'low-stock' | 'out-of-stock';
  tags?: string[];
}

export interface OrderFilters {
  search?: string;
  status?: Order['status'][];
  paymentStatus?: Order['paymentStatus'][];
  fulfillmentStatus?: Order['fulfillmentStatus'][];
  dateFrom?: string;
  dateTo?: string;
}

export interface CustomerFilters {
  search?: string;
  status?: Customer['status'];
  segment?: Customer['segment'];
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
}