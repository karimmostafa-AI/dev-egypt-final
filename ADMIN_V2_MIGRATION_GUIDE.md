# Admin Panel V2 Migration Guide

## Overview

This document describes the new Admin Panel V2 (`/admin-v2/*`) and the migration from the original admin panel (`/admin/*`).

## What's New

### Enhanced Design
- **Professional Layout**: Modern sidebar with improved navigation, breadcrumbs, and user menu
- **Better Information Display**: Enhanced metrics cards, progress indicators, and data visualization
- **Improved UX**: Better spacing, typography, and visual hierarchy
- **Responsive Design**: Optimized for mobile, tablet, and desktop

### New Features
- **Size Guide Image Upload**: Required field when adding new products
- **Enhanced Dashboard**: More informative metrics with trend indicators
- **Better Product Management**: Improved filtering, sorting, and search capabilities
- **Professional Navigation**: Breadcrumbs, grouped navigation items, and quick actions

## Key Changes

### Size Guide Image Requirement

**IMPORTANT**: All new products must include a size guide image.

- **Location**: Step 2 of product creation (Product Images & Size Guide)
- **Required**: Yes (validation prevents proceeding without it)
- **File Types**: JPG, PNG, WebP
- **Max Size**: 5MB
- **Storage**: Stored in Appwrite Storage with `image_type: "size_guide"`
- **Display**: Shown on product detail pages and in admin product views

### Route Structure

The new admin panel is accessible at `/admin-v2/*` routes:

- `/admin-v2` - Enhanced Dashboard
- `/admin-v2/login` - Login page
- `/admin-v2/products` - Products list (enhanced)
- `/admin-v2/products/new` - New product form (with size guide requirement)
- `/admin-v2/orders` - Orders management
- `/admin-v2/customers` - Customer management
- `/admin-v2/analytics` - Analytics dashboard
- `/admin-v2/settings` - Settings page
- `/admin-v2/categories` - Category management
- `/admin-v2/brands` - Brand management
- `/admin-v2/inventory` - Inventory management

### API Changes

#### Product API (`/api/admin/products`)

**New Field**: `sizeGuideImage`
- Type: `string` (optional in schema, but required by frontend validation)
- Description: URL of the uploaded size guide image
- Storage: Saved to `product_images` collection with `image_type: "size_guide"`

**Example Request**:
```json
{
  "name": "Product Name",
  "slug": "product-slug",
  "brand_id": "...",
  "category_id": "...",
  "price": 29.99,
  "mainImage": "https://...",
  "backImage": "https://...",
  "sizeGuideImage": "https://...",  // NEW: Required
  "variations": [...]
}
```

#### Image Upload API (`/api/admin/upload-image`)

**New Type**: `size-guide`
- Accepts `type: "size-guide"` in FormData
- Validates image format and size (max 5MB)
- Returns image URL for use in product creation

## Migration Steps

### For Developers

1. **Access New Admin Panel**
   - Navigate to `/admin-v2/login`
   - Use same credentials as old admin panel
   - All authentication and authorization remains the same

2. **Test New Features**
   - Create a new product and verify size guide upload works
   - Test all CRUD operations
   - Verify data consistency between old and new panels

3. **Compare Functionality**
   - Old admin: `/admin/*`
   - New admin: `/admin-v2/*`
   - Both are accessible simultaneously for comparison

### For Administrators

1. **Familiarize with New Interface**
   - Explore the enhanced dashboard
   - Review improved product management features
   - Test the new product creation flow

2. **Size Guide Requirement**
   - When adding new products, you must upload a size guide image
   - This is a required field and cannot be skipped
   - Size guide helps customers choose the right size

3. **Gradual Migration**
   - Both admin panels are available
   - Use the new panel for new products (size guide required)
   - Old panel remains functional for existing workflows

## Database Schema

### Product Images Collection

New image type added:
- `image_type: "size_guide"` - Size guide images for products
- Stored alongside `front` and `back` image types
- Linked to product via `product_id`

## File Structure

```
src/app/admin-v2/
├── layout.tsx                    # Enhanced admin layout
├── page.tsx                      # Enhanced dashboard
├── login/
│   └── page.tsx                 # Login page
├── products/
│   ├── page.tsx                 # Enhanced products list
│   └── new/
│       └── page.tsx             # New product form (with size guide)
├── orders/
│   └── page.tsx                 # Orders management
├── customers/
│   └── page.tsx                 # Customer management
├── analytics/
│   └── page.tsx                 # Analytics dashboard
├── settings/
│   └── page.tsx                 # Settings page
├── categories/
│   └── page.tsx                 # Category management
├── brands/
│   └── page.tsx                 # Brand management
└── inventory/
    └── page.tsx                 # Inventory management
```

## Breaking Changes

### None

- Old admin panel (`/admin/*`) remains fully functional
- No breaking changes to existing APIs
- Size guide is optional in API schema (frontend enforces requirement)
- Existing products without size guides continue to work

## Future Migration

Once the new admin panel is fully tested and approved:

1. **Option 1: Redirect**
   - Update middleware to redirect `/admin/*` to `/admin-v2/*`
   - Keep old routes as backup

2. **Option 2: Replace**
   - Move old admin to `/admin-legacy/*`
   - Rename `/admin-v2/*` to `/admin/*`
   - Update all internal links

3. **Option 3: Gradual**
   - Keep both versions
   - Migrate features incrementally
   - Eventually deprecate old version

## Testing Checklist

- [x] New admin panel accessible at `/admin-v2/*`
- [x] Login works with existing credentials
- [x] Dashboard displays metrics correctly
- [x] Product creation requires size guide image
- [x] Size guide image uploads successfully
- [x] Product API handles size guide image
- [x] All existing features work in new panel
- [x] Responsive design works on all devices
- [x] No linting errors

## Support

For issues or questions:
1. Check this documentation
2. Review `ADMIN_LEGACY_STRUCTURE.md` for old admin reference
3. Compare old vs new admin panels side-by-side
4. Test in both environments before reporting issues

## Notes

- Size guide images are stored in the same storage bucket as other product images
- Size guide validation happens on the frontend (Step 2 validation)
- Backend accepts size guide as optional but frontend enforces requirement
- Old products without size guides can be updated later
- Size guide images are displayed on product detail pages

