# Appwrite Schema
\n## Database 68dbeceb003bf10d9498
### products (products)
Settings:
 - documentSecurity: False
 - enabled: True
 - createdAt: 2025-10-02T01:36:59.604+00:00
 - updatedAt: 2025-10-02T01:38:01.185+00:00
 - permission: read("any")
 - permission: create("user:68ddd04e00113cd63b0b")
 - permission: read("user:68ddd04e00113cd63b0b")
 - permission: update("user:68ddd04e00113cd63b0b")
 - permission: delete("user:68ddd04e00113cd63b0b")
Attributes:
 - name: string [required, single]
 - slug: string [optional, single]
 - brand_id: string [optional, single]
 - units: integer [optional, single]
 - price: double [required, single]
 - discount_price: double [optional, single]
 - min_order_quantity: integer [required, single]
 - description: string [optional, single]
 - is_active: boolean [required, single]
 - is_new: boolean [required, single]
 - is_featured: boolean [required, single]
 - category_id: string [required, single]
 - lastViewedAt: datetime [optional, single]
 - meta_title: string [optional, single]
 - meta_description: string [optional, single]
 - meta_keywords: string [optional, single]
 - available_units: string [required, single]
 - reserved_units: string [required, single]
 - stock_status: string [required, single]
 - last_restocked_at: datetime [optional, single]
Indexes:
 - slug_index: key on [slug] (orders: [ASC])
 - price_index: key on [price] (orders: [ASC])
 - is_active_index: key on [is_active] (orders: [ASC])
 - brand_index: key on [brand_id] (orders: [ASC])
 - featured_products: key on [is_featured, is_active] (orders: [DESC, DESC])
 - isNew_index: key on [is_new] (orders: [DESC])
Example documents (up to 3):
- No documents

### categories (categories)
Settings:
 - documentSecurity: False
 - enabled: True
 - createdAt: 2025-10-02T01:54:33.038+00:00
 - updatedAt: 2025-10-02T01:59:05.322+00:00
 - permission: read("any")
 - permission: create("user:68ddd04e00113cd63b0b")
 - permission: read("user:68ddd04e00113cd63b0b")
 - permission: update("user:68ddd04e00113cd63b0b")
 - permission: delete("user:68ddd04e00113cd63b0b")
Attributes:
 - name: string [required, single]
 - status: boolean [required, single]
Indexes:
 - name_index: key on [name] (orders: [ASC])
 - status_index: key on [status] (orders: [DESC])
 - active_categories: key on [status, name] (orders: [DESC, ASC])
Example documents (up to 3):
- No documents

### orders (orders)
Settings:
 - documentSecurity: False
 - enabled: True
 - createdAt: 2025-10-02T02:09:51.714+00:00
 - updatedAt: 2025-10-17T22:20:01.422+00:00
 - permission: create("user:68ddd04e00113cd63b0b")
 - permission: read("user:68ddd04e00113cd63b0b")
 - permission: update("user:68ddd04e00113cd63b0b")
 - permission: delete("user:68ddd04e00113cd63b0b")
 - permission: read("users")
Attributes:
 - brand_id: string [required, single]
 - customer_id: string [optional, single]
 - prefix: string [optional, single]
 - coupon_id: string [optional, single]
 - coupon_discount: double [optional, single]
 - pick_date: datetime [optional, single]
 - delivery_date: datetime [optional, single]
 - payable_amount: double [required, single]
 - total_amount: double [required, single]
 - discount: double [optional, single]
 - payment_status: string [required, single]
 - order_status: string [required, single]
 - payment_method: string [optional, single]
 - address_id: string [optional, single]
 - invoice_path: string [optional, single]
 - delivered_at: datetime [optional, single]
 - order_code: string [required, single]
Indexes:
 - order_code_index: unique on [order_code] (orders: [ASC])
 - customer_orders: key on [customer_id] (orders: [DESC])
 - brand_orders: key on [brand_id] (orders: [DESC])
 - payment_status_index: key on [payment_status] (orders: [ASC])
 - order_status_index: key on [order_status] (orders: [ASC])
 - delivery_date_index: key on [delivery_date] (orders: [ASC])
 - shop_status_composite: key on [brand_id, order_status] (orders: [DESC, ASC])
Example documents (up to 3):
- No documents

### brands (brands)
Settings:
 - documentSecurity: False
 - enabled: True
 - createdAt: 2025-10-02T06:57:24.871+00:00
 - updatedAt: 2025-10-02T07:07:41.527+00:00
 - permission: read("any")
 - permission: create("user:68ddd04e00113cd63b0b")
 - permission: read("user:68ddd04e00113cd63b0b")
 - permission: update("user:68ddd04e00113cd63b0b")
 - permission: delete("user:68ddd04e00113cd63b0b")
Attributes:
 - name: string [required, single]
 - logo_id: string [optional, single]
 - prefix: string [required, single]
 - status: boolean [required, single]
Indexes:
 - name_index: key on [name] (orders: [ASC])
 - status_index: key on [status] (orders: [DESC])
 - prefix_index: key on [prefix] (orders: [ASC])
Example documents (up to 3):
- No documents

### product variations (product_variations)
Settings:
 - documentSecurity: False
 - enabled: True
 - createdAt: 2025-10-13T22:35:12.480+00:00
 - updatedAt: 2025-10-17T16:34:55.740+00:00
 - permission: create("user:68ddd04e00113cd63b0b")
 - permission: read("user:68ddd04e00113cd63b0b")
 - permission: update("user:68ddd04e00113cd63b0b")
 - permission: delete("user:68ddd04e00113cd63b0b")
 - permission: read("any")
Attributes:
 - product_id: string [required, single]
 - color_name: string [required, single]
 - color_hex: string [required, single]
 - sku: string [optional, single]
 - stock_quantity: integer [optional, single]
 - is_active: boolean [optional, single]
 - price_modifier: double [optional, single]
 - sort_order: integer [optional, single]
Indexes:
- No indexes
Example documents (up to 3):
- No documents

### product images (product_images)
Settings:
 - documentSecurity: False
 - enabled: True
 - createdAt: 2025-10-13T22:40:46.426+00:00
 - updatedAt: 2025-10-17T16:35:10.298+00:00
 - permission: create("user:68ddd04e00113cd63b0b")
 - permission: read("user:68ddd04e00113cd63b0b")
 - permission: update("user:68ddd04e00113cd63b0b")
 - permission: delete("user:68ddd04e00113cd63b0b")
 - permission: read("any")
Attributes:
 - product_id: string [required, single]
 - variation_id: string [required, single]
 - image_type: string [required, single]
 - image_url: string [required, single]
 - image_id: string [required, single]
 - alt_text: string [optional, single]
 - sort_order: integer [optional, single]
 - is_primary: boolean [optional, single]
Indexes:
- No indexes
Example documents (up to 3):
- No documents

### Inventory Movements (inventory_movements)
Settings:
 - documentSecurity: True
 - enabled: True
 - createdAt: 2025-11-04T09:14:34.803+00:00
 - updatedAt: 2025-11-04T09:14:34.803+00:00
 - permission: read("users")
 - permission: create("team:admin")
 - permission: update("team:admin")
 - permission: delete("team:admin")
Attributes:
 - name: string [optional, single]
 - description: string [optional, single]
 - route: linestring [optional, single]
 - location: point [optional, single]
 - city: string [optional, single]
 - active: boolean [optional, single]
 - email: string [optional, single]
 - age: integer [optional, single]
Indexes:
- No indexes
Example documents (up to 3):
- No documents

### Inventory Alerts (inventory_alerts)
Settings:
 - documentSecurity: True
 - enabled: True
 - createdAt: 2025-11-04T09:14:35.449+00:00
 - updatedAt: 2025-11-04T09:14:35.449+00:00
 - permission: read("users")
 - permission: create("team:admin")
 - permission: update("team:admin")
 - permission: delete("team:admin")
 - permission: create("team:system")
 - permission: update("team:system")
 - permission: delete("team:system")
Attributes:
 - name: string [optional, single]
 - active: boolean [optional, single]
 - age: integer [optional, single]
 - route: linestring [optional, single]
 - email: string [optional, single]
 - location: point [optional, single]
 - description: string [optional, single]
 - city: string [optional, single]
Indexes:
- No indexes
Example documents (up to 3):
- No documents

### Inventory Audit Items (inventory_audit_items)
Settings:
 - documentSecurity: True
 - enabled: True
 - createdAt: 2025-11-04T09:14:36.045+00:00
 - updatedAt: 2025-11-04T09:14:36.045+00:00
 - permission: read("users")
 - permission: create("team:admin")
 - permission: update("team:admin")
 - permission: delete("team:admin")
Attributes:
 - audit_id: string [required, single]
 - product_id: string [required, single]
 - product_name: string [required, single]
 - product_sku: string [required, single]
 - expected_quantity: integer [required, single]
 - actual_quantity: integer [required, single]
 - discrepancy: integer [required, single]
Indexes:
- No indexes
Example documents (up to 3):
- No documents

### Stock Movements (stock_movements)
Settings:
 - documentSecurity: False
 - enabled: True
 - createdAt: 2025-11-11T12:25:12.839+00:00
 - updatedAt: 2025-11-11T12:25:12.839+00:00
 - permission: create("team:admin")
 - permission: read("team:admin")
 - permission: update("team:admin")
 - permission: delete("team:admin")
Attributes:
 - product_id: string [required, single]
 - movement_type: string [required, single]
 - quantity_change: integer [required, single]
Indexes:
- No indexes
Example documents (up to 3):
- No documents


