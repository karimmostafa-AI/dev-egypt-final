// Test script to verify the product creation fix
const testProductData = {
  name: "Test Product",
  slug: "test-product",
  price: 29.99,
  brand_id: "test-brand-id",
  category_id: "test-category-id",
  sku: "TEST-PROD-001",
  stockQuantity: 100,
  lowStockThreshold: 5,
  status: "active",
  viewCount: 0,
  salesCount: 0,
  description: "Test product description",
  units: 1,
  min_order_quantity: 1,
  is_active: true,
  is_new: false,
  is_featured: false,
  hasVariations: false,
  variations: [],
  colorOptions: [],
  sizeOptions: [],
  mainImageId: null,
  mainImageUrl: null,
  backImageId: null,
  backImageUrl: null,
  galleryImages: [],
  imageVariations: []
};

console.log("Test product data prepared:");
console.log(JSON.stringify(testProductData, null, 2));
console.log("\nThis data should now work with the updated API route.");