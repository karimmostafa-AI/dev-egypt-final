# Inventory System - Database Setup Instructions

## 📋 Overview
This document provides step-by-step instructions to create the `inventory_transactions` collection in Appwrite Console.

---

## 🗄️ Collection: `inventory_transactions`

### Step 1: Create Collection
1. Open your **Appwrite Console**
2. Navigate to **Databases** → Select your database
3. Click **"Create Collection"**
4. Set collection ID: `inventory_transactions`
5. Set collection name: `Inventory Transactions`

### Step 2: Add Attributes

Add the following attributes to the collection:

| Attribute Name | Type | Size | Required | Default | Description |
|----------------|------|------|----------|---------|-------------|
| `product_id` | String | 255 | ✅ Yes | - | Foreign key to products collection |
| `variation_id` | String | 255 | ❌ No | null | Foreign key to product_variations (optional) |
| `order_id` | String | 255 | ❌ No | null | Foreign key to orders collection (optional) |
| `transaction_type` | Enum | - | ✅ Yes | - | Type: sale, return, adjustment, restock |
| `quantity_change` | Integer | - | ✅ Yes | 0 | Positive or negative change in stock |
| `previous_quantity` | Integer | - | ✅ Yes | 0 | Stock level before transaction |
| `new_quantity` | Integer | - | ✅ Yes | 0 | Stock level after transaction |
| `notes` | String | 1000 | ❌ No | '' | Additional notes/reason |
| `created_by` | String | 255 | ❌ No | 'system' | User ID who created the transaction |

**Enum Values for `transaction_type`:**
- `sale` - Stock sold through order
- `return` - Stock returned from cancelled order
- `adjustment` - Manual adjustment by admin
- `restock` - Stock replenishment

### Step 3: Add Indexes

Create the following indexes for optimized queries:

| Index Key | Type | Attributes | Order |
|-----------|------|------------|-------|
| `product_id_idx` | Key | `product_id` | ASC |
| `variation_id_idx` | Key | `variation_id` | ASC |
| `order_id_idx` | Key | `order_id` | ASC |
| `created_at_idx` | Key | `$createdAt` | DESC |
| `transaction_type_idx` | Key | `transaction_type` | ASC |

### Step 4: Set Permissions

Configure the following permissions:

**Read Permissions:**
- Role: `users` (authenticated users can read their own transactions)
- Role: `team:admin` (admins can read all)

**Create Permissions:**
- Role: `team:admin` (only admins and system can create)
- Role: `users` (for system-generated transactions)

**Update Permissions:**
- Role: `team:admin` (only admins can update)

**Delete Permissions:**
- Role: `team:admin` (only admins can delete, use with caution)

---

## ✅ Verification

After setup, verify the collection:

1. **Test Transaction Logging:**
   - Place a test order through the system
   - Check `inventory_transactions` collection
   - Verify a new document was created with:
     - Correct `product_id` or `variation_id`
     - `transaction_type` = `sale`
     - Negative `quantity_change`
     - Correct `order_id`

2. **Test Manual Adjustment:**
   - Use the admin inventory page (when built)
   - Make a stock adjustment
   - Verify transaction is logged with `transaction_type` = `adjustment`

3. **Test Stock Release:**
   - Cancel an order
   - Verify a `return` transaction is created
   - Verify stock is added back

---

## 🔧 Troubleshooting

### Issue: "Collection not found"
**Solution:** Ensure the collection ID is exactly `inventory_transactions` (lowercase, underscore)

### Issue: "Attribute type mismatch"
**Solution:** Double-check attribute types match exactly as specified above

### Issue: "Permission denied"
**Solution:** 
- Check API key has admin permissions
- Verify your role permissions in Appwrite Console

### Issue: "Transaction not logging"
**Solution:**
- Check server logs for errors
- Verify collection permissions allow writes
- Ensure `DATABASE_ID` environment variable is correct

---

## 📊 Sample Document Structure

Here's what a transaction document looks like:

```json
{
  "$id": "67891abc...",
  "$collectionId": "inventory_transactions",
  "$databaseId": "your_database_id",
  "$createdAt": "2025-01-12T10:30:00.000+00:00",
  "$updatedAt": "2025-01-12T10:30:00.000+00:00",
  "$permissions": [...],
  "product_id": "product_12345",
  "variation_id": "variation_67890",
  "order_id": "order_abcdef",
  "transaction_type": "sale",
  "quantity_change": -2,
  "previous_quantity": 50,
  "new_quantity": 48,
  "notes": "Stock reserved for order ORD-20250112-ABCDE",
  "created_by": "customer_xyz"
}
```

---

## 📈 Next Steps

After creating the collection:

1. ✅ Test order placement and verify stock deduction
2. ✅ Build admin inventory management UI
3. ✅ Create inventory history API endpoint
4. ✅ Add low stock alerts
5. ✅ Implement bulk stock updates

---

## 🆘 Need Help?

If you encounter issues:
1. Check Appwrite Console for error messages
2. Review server logs for detailed errors
3. Verify environment variables are set correctly
4. Ensure Appwrite version is compatible (14.0+)

---

**Status:** ⏳ Ready for Implementation

Once this collection is created, the inventory system will automatically start logging all stock transactions!
