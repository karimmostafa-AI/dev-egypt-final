export interface Product {
  $id: string
  name: string
  slug: string
  brand_id: string
  category_id: string
  units: number
  price: number
  discount_price: number
  min_order_quantity: number
  description: string
  is_active: boolean
  is_new: boolean
  is_featured: boolean
  hasVariations: boolean
  variations?: string
  colorOptions?: string
  sizeOptions?: string
  backImageId?: string
  mainImageUrl?: string
  backImageUrl?: string
  galleryImages?: string
  imageVariations?: string
  mainImageId?: string
  media_id?: string
  meta_title?: string
  meta_description?: string
  meta_keywords?: string
  compareAtPrice?: number | null
  costPerItem?: number | null
  sku?: string
  stockQuantity?: number
  lowStockThreshold?: number
  tags?: string[]
  status?: string
  featuredImageId?: string | null
  viewCount?: number
  salesCount?: number
  lastViewedAt?: string | null
  $createdAt: string
  $updatedAt: string
  $permissions?: string[]
  $databaseId?: string
  $tableId?: string
  $sequence?: number
}

export interface CreateProductData {
  name: string
  slug: string
  brand_id: string
  category_id: string
  units: number
  price: number
  discount_price: number
  min_order_quantity: number
  description: string
  is_active: boolean
  is_new: boolean
  is_featured: boolean
  hasVariations: boolean
  variations?: string
  colorOptions?: string
  sizeOptions?: string
  backImageId?: string
  mainImageUrl?: string
  backImageUrl?: string
  galleryImages?: string
  imageVariations?: string
  mainImageId?: string
  compareAtPrice?: number | null
  costPerItem?: number | null
  sku?: string
  stockQuantity?: number
  lowStockThreshold?: number
  tags?: string[]
  status?: string
  featuredImageId?: string | null
  viewCount?: number
  salesCount?: number
  lastViewedAt?: string | null
}

export interface UpdateProductData extends Partial<CreateProductData> {}

export interface ProductFilters {
  search?: string
  available?: boolean
  catalog?: string
  brand?: string
  priceMin?: number
  priceMax?: number
}

export interface ProductStats {
  total: number
  available: number
  unavailable: number
  onSale: number
  lowStock: number
  outOfStock: number
  totalValue: number
}