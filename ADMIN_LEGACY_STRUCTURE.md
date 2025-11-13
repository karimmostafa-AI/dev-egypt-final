# Admin Legacy Structure Documentation

This document describes the structure of the original admin panel (backed up for reference).

## Route Structure

The original admin panel is located at `/admin/*` with the following routes:

### Main Routes
- `/admin` - Dashboard page
- `/admin/login` - Login page
- `/admin/products` - Products list page
- `/admin/products/new` - New product creation form
- `/admin/orders` - Orders list page
- `/admin/orders/[id]` - Order details page
- `/admin/customers` - Customers list page
- `/admin/customers/[id]` - Customer details page
- `/admin/categories` - Categories management
- `/admin/brands` - Brands management
- `/admin/brands/[id]/landing` - Brand landing page editor
- `/admin/analytics` - Analytics dashboard
- `/admin/inventory` - Inventory management
- `/admin/settings` - Settings page

## File Structure

```
src/app/admin/
├── layout.tsx                    # Main admin layout with sidebar
├── page.tsx                      # Dashboard page
├── login/
│   ├── layout.tsx               # Login layout
│   └── page.tsx                 # Login page
├── products/
│   ├── page.tsx                 # Products list
│   └── new/
│       └── page.tsx             # New product form (4-step wizard)
├── orders/
│   ├── page.tsx                 # Orders list
│   └── [id]/
│       └── page.tsx             # Order details
├── customers/
│   ├── page.tsx                 # Customers list
│   └── [id]/
│       └── page.tsx             # Customer details
├── categories/
│   └── page.tsx                 # Categories management
├── brands/
│   ├── page.tsx                 # Brands list
│   └── [id]/
│       └── landing/
│           └── page.tsx         # Brand landing page editor
├── analytics/
│   └── page.tsx                 # Analytics dashboard
├── inventory/
│   └── page.tsx                 # Inventory management
└── settings/
    └── page.tsx                 # Settings page
```

## Key Features

### Layout
- Sidebar navigation with 7 main sections
- Mobile-responsive with sheet drawer
- Header with search and notifications
- User profile section in sidebar

### Navigation Items
1. Dashboard (Home icon)
2. Products (Package icon)
3. Categories (Tags icon)
4. Orders (ShoppingCart icon)
5. Customers (Users icon)
6. Analytics (BarChart3 icon)
7. Settings (Settings icon)

### Authentication
- Role-based access control (admin role required)
- Session management via Appwrite
- Automatic redirect to login if not authenticated
- Session verification on route changes

### Product Management
- Multi-step product creation form (4 steps):
  1. Basic Information (name, price, brand, category, SEO)
  2. Product Images (main view, back view)
  3. Variations (colors, sizes, color images)
  4. Review & Status
- Product listing with search, filters, and sorting
- Real-time data updates

### Dashboard
- Metrics cards (Revenue, Orders, Customers, AOV)
- Recent orders table
- Low stock alerts
- Trend indicators

## Components Used

### UI Components (shadcn/ui)
- Button, Input, Card, Badge
- Table, Select, Switch
- Sheet, Alert, Progress
- DropdownMenu, AlertDialog

### Icons (lucide-react)
- Home, Package, ShoppingCart, Users
- Settings, BarChart3, Tags, Bell, Search
- Menu, X, and various others

## API Endpoints

- `/api/admin/dashboard` - Dashboard data
- `/api/admin/products` - Product CRUD operations
- `/api/admin/orders` - Order management
- `/api/admin/customers` - Customer management
- `/api/admin/categories` - Category management
- `/api/admin/brands` - Brand management
- `/api/admin/upload-image` - Image upload
- `/api/admin/analytics` - Analytics data

## Notes

- All admin routes require authentication
- Admin role is checked via `user.prefs?.role === 'admin'`
- Uses Appwrite for backend services
- Real-time data updates via custom hooks
- Responsive design for mobile, tablet, and desktop

## Migration Notes

This structure is preserved for reference during the migration to `/admin-v2/*`. The new admin panel should maintain feature parity while improving:
- UI/UX design
- Information display
- Professional appearance
- Size guide image upload requirement for products

