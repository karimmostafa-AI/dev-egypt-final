# 🔧 Manual Analytics Patch Instructions

Due to SDK/API version compatibility, you'll need to add the missing attributes manually through the Appwrite Console. This is a one-time setup that takes about 10 minutes.

---

## 🎯 Why Manual?

The automated patch script encountered an API version mismatch. Adding attributes manually through the Appwrite Console is the most reliable method.

---

## 📋 Step-by-Step Instructions

### 1. Access Appwrite Console

Go to: https://fra.cloud.appwrite.io/console

Navigate to:
- Your Project (68dbeba80017571a1581)
- Databases
- Your Database (68dbeceb003bf10d9498)

---

## 📦 Collections to Patch

### **Collection 1: product_analytics**

**Add these 9 attributes:**

| Attribute Name | Type | Required | Default | Size |
|---------------|------|----------|---------|------|
| views | Integer | ☐ No | 0 | - |
| add_to_cart | Integer | ☐ No | 0 | - |
| purchases | Integer | ☐ No | 0 | - |
| returns | Integer | ☐ No | 0 | - |
| revenue | Float | ☐ No | 0 | - |
| discounted_sales | Integer | ☐ No | 0 | - |
| average_price | Float | ☐ No | 0 | - |
| conversion_rate | Float | ☐ No | 0 | - |
| wishlist_adds | Integer | ☐ No | 0 | - |

**How to add:**
1. Click on `product_analytics` collection
2. Go to "Attributes" tab
3. Click "Create Attribute"
4. Select type (Integer/Float)
5. Enter attribute name
6. Uncheck "Required"
7. Set default value to 0
8. Click "Create"
9. Repeat for all 9 attributes

---

### **Collection 2: session_tracking**

**Add these 3 attributes:**

| Attribute Name | Type | Required | Default |
|---------------|------|----------|---------|
| pages_viewed | Integer | ☐ No | 0 |
| time_on_site | Float | ☐ No | 0 |
| converted | Boolean | ☐ No | false |

**Add 1 index:**
- **Name:** converted_idx
- **Type:** Key
- **Attributes:** converted

---

### **Collection 3: customer_feedback**

**Add these 3 attributes:**

| Attribute Name | Type | Required | Default | Size |
|---------------|------|----------|---------|------|
| status | String | ☐ No | pending | 50 |
| helpful_count | Integer | ☐ No | 0 | - |
| verified_purchase | Boolean | ☐ No | false | - |

**Add 1 index:**
- **Name:** status_idx
- **Type:** Key
- **Attributes:** status

---

### **Collection 4: financial_analytics**

**Add these 12 attributes:**

| Attribute Name | Type | Required | Default |
|---------------|------|----------|---------|
| gross_revenue | Float | ☐ No | 0 |
| net_revenue | Float | ☐ No | 0 |
| total_orders | Integer | ☐ No | 0 |
| refunds | Float | ☐ No | 0 |
| cost_of_goods_sold | Float | ☐ No | 0 |
| operational_expense | Float | ☐ No | 0 |
| net_profit | Float | ☐ No | 0 |
| profit_margin | Float | ☐ No | 0 |
| average_order_value | Float | ☐ No | 0 |
| tax_collected | Float | ☐ No | 0 |
| shipping_collected | Float | ☐ No | 0 |
| discounts_given | Float | ☐ No | 0 |

---

### **Collection 5: traffic_sources**

**Add these 6 attributes:**

| Attribute Name | Type | Required | Default |
|---------------|------|----------|---------|
| clicks | Integer | ☐ No | 0 |
| sessions | Integer | ☐ No | 0 |
| conversions | Integer | ☐ No | 0 |
| revenue | Float | ☐ No | 0 |
| bounce_rate | Float | ☐ No | 0 |
| avg_session_duration | Float | ☐ No | 0 |

---

### **Collection 6: category_analytics**

**Add these 5 attributes:**

| Attribute Name | Type | Required | Default |
|---------------|------|----------|---------|
| views | Integer | ☐ No | 0 |
| orders | Integer | ☐ No | 0 |
| revenue | Float | ☐ No | 0 |
| units_sold | Integer | ☐ No | 0 |
| conversion_rate | Float | ☐ No | 0 |

---

### **Collection 7: brand_analytics**

**Add these 6 attributes:**

| Attribute Name | Type | Required | Default |
|---------------|------|----------|---------|
| views | Integer | ☐ No | 0 |
| orders | Integer | ☐ No | 0 |
| revenue | Float | ☐ No | 0 |
| units_sold | Integer | ☐ No | 0 |
| conversion_rate | Float | ☐ No | 0 |
| return_rate | Float | ☐ No | 0 |

---

## ✅ Quick Reference: Attributes by Type

### Integer Attributes (Default: 0)
```
views, add_to_cart, purchases, returns, discounted_sales, wishlist_adds,
pages_viewed, helpful_count, total_orders, clicks, sessions, conversions,
orders, units_sold
```

### Float Attributes (Default: 0)
```
revenue, average_price, conversion_rate, time_on_site, gross_revenue,
net_revenue, refunds, cost_of_goods_sold, operational_expense, net_profit,
profit_margin, average_order_value, tax_collected, shipping_collected,
discounts_given, bounce_rate, avg_session_duration, return_rate
```

### Boolean Attributes (Default: false)
```
converted, verified_purchase
```

### String Attributes
```
status (Default: 'pending', Size: 50)
```

---

## 💡 Tips for Faster Setup

1. **Keep Console Open:** Open Appwrite Console in a separate window
2. **Use Tab Key:** Navigate fields quickly with Tab
3. **Copy Names:** Copy attribute names directly from this doc
4. **Check Defaults:** Always verify the default value matches
5. **Verify After Each Collection:** Check the attributes tab to confirm

---

## 🎯 After Completing

Once all attributes are added:

1. ✅ Refresh your dashboard: `http://localhost:3000/admin/analytics`
2. ✅ Collections are now 100% complete
3. ✅ Ready to store real analytics data

---

## 📊 Progress Checklist

- [ ] product_analytics (9 attributes)
- [ ] session_tracking (3 attributes + 1 index)
- [ ] customer_feedback (3 attributes + 1 index)
- [ ] financial_analytics (12 attributes)
- [ ] traffic_sources (6 attributes)
- [ ] category_analytics (5 attributes)
- [ ] brand_analytics (6 attributes)

**Total:** 44 attributes + 2 indexes

---

## 🆘 Troubleshooting

### "Attribute name already exists"
✅ Skip it - it was already created

### Can't find "Create Attribute" button?
1. Make sure you're in the collection view
2. Click the "Attributes" tab
3. Button should be in the top right

### Default value not accepting?
- Make sure "Required" is **unchecked** first
- Then set the default value

---

## 🚀 Alternative: Wait for SDK Fix

If you prefer automation, you can:

1. Wait for node-appwrite SDK update
2. Or upgrade your Appwrite Cloud instance
3. Then re-run `npm run patch:analytics`

But manual setup is fastest for now (10-15 minutes max).

---

## ✨ Summary

**Time Required:** 10-15 minutes  
**Difficulty:** Easy (copy & paste)  
**Benefit:** Fully operational analytics system  

Once done, your analytics infrastructure will be **100% complete**!

---

**Questions?** Check the main documentation:
- `ANALYTICS_SETUP.md` - Full setup guide
- `ANALYTICS_QUICKSTART.md` - Quick reference
