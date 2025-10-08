export interface Product {
  $id: string
  name: string
  slug: string
  media_id?: string
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
  meta_title: string
  meta_description: string
  meta_keywords: string
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
  media_id?: string
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
  meta_title: string
  meta_description: string
  meta_keywords: string
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