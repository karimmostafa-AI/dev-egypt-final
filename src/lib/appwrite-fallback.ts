// Appwrite Fallback Data and Connectivity Utils
// Provides fallback data when Appwrite is not available

export interface FallbackProduct {
  $id: string;
  name: string;
  slug: string;
  media_id?: string;
  brand_id: string;
  category_id: string;
  units: number;
  price: number;
  discount_price: number;
  min_order_quantity: number;
  description: string;
  is_active: boolean;
  is_new: boolean;
  is_featured: boolean;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  $createdAt: string;
  $updatedAt: string;
}

export interface FallbackCategory {
  $id: string;
  name: string;
  status: boolean;
  $createdAt: string;
  $updatedAt: string;
}

export interface FallbackBrand {
  $id: string;
  name: string;
  prefix: string;
  status: boolean;
  $createdAt: string;
  $updatedAt: string;
}

// Fallback data for when Appwrite is not available
export const fallbackCategories: FallbackCategory[] = [
  {
    $id: 'fallback-cat-1',
    name: 'Women\'s Scrubs',
    status: true,
    $createdAt: new Date().toISOString(),
    $updatedAt: new Date().toISOString()
  },
  {
    $id: 'fallback-cat-2',
    name: 'Men\'s Scrubs',
    status: true,
    $createdAt: new Date().toISOString(),
    $updatedAt: new Date().toISOString()
  },
  {
    $id: 'fallback-cat-3',
    name: 'Medical Apparel',
    status: true,
    $createdAt: new Date().toISOString(),
    $updatedAt: new Date().toISOString()
  },
  {
    $id: 'fallback-cat-4',
    name: 'Accessories',
    status: true,
    $createdAt: new Date().toISOString(),
    $updatedAt: new Date().toISOString()
  },
  {
    $id: 'fallback-cat-5',
    name: 'Footwear',
    status: true,
    $createdAt: new Date().toISOString(),
    $updatedAt: new Date().toISOString()
  }
];

export const fallbackBrands: FallbackBrand[] = [
  {
    $id: 'fallback-brand-1',
    name: 'Dev Egypt',
    prefix: 'UA',
    status: true,
    $createdAt: new Date().toISOString(),
    $updatedAt: new Date().toISOString()
  },
  {
    $id: 'fallback-brand-2',
    name: 'Cherokee',
    prefix: 'CHE',
    status: true,
    $createdAt: new Date().toISOString(),
    $updatedAt: new Date().toISOString()
  },
  {
    $id: 'fallback-brand-3',
    name: 'WonderWink',
    prefix: 'WW',
    status: true,
    $createdAt: new Date().toISOString(),
    $updatedAt: new Date().toISOString()
  }
];

export const fallbackProducts: FallbackProduct[] = [
  {
    $id: 'fallback-prod-1',
    name: 'Classic Women\'s Scrub Top',
    slug: 'classic-womens-scrub-top',
    media_id: '',
    brand_id: 'fallback-brand-1',
    category_id: 'fallback-cat-1',
    units: 1,
    price: 29.99,
    discount_price: 0,
    min_order_quantity: 1,
    description: 'Comfortable and durable scrub top perfect for healthcare professionals.',
    is_active: true,
    is_new: false,
    is_featured: true,
    meta_title: 'Classic Women\'s Scrub Top',
    meta_description: 'Professional scrub top for healthcare workers',
    meta_keywords: 'scrubs, medical, healthcare, women',
    $createdAt: new Date().toISOString(),
    $updatedAt: new Date().toISOString()
  },
  {
    $id: 'fallback-prod-2',
    name: 'Men\'s Cargo Scrub Pants',
    slug: 'mens-cargo-scrub-pants',
    media_id: '',
    brand_id: 'fallback-brand-1',
    category_id: 'fallback-cat-2',
    units: 1,
    price: 34.99,
    discount_price: 24.99,
    min_order_quantity: 1,
    description: 'Practical cargo scrub pants with multiple pockets for medical professionals.',
    is_active: true,
    is_new: true,
    is_featured: false,
    meta_title: 'Men\'s Cargo Scrub Pants',
    meta_description: 'Durable cargo pants for male healthcare workers',
    meta_keywords: 'scrubs, medical, healthcare, men, cargo',
    $createdAt: new Date().toISOString(),
    $updatedAt: new Date().toISOString()
  },
  {
    $id: 'fallback-prod-3',
    name: 'Comfortable Medical Shoes',
    slug: 'comfortable-medical-shoes',
    media_id: '',
    brand_id: 'fallback-brand-2',
    category_id: 'fallback-cat-5',
    units: 1,
    price: 89.99,
    discount_price: 0,
    min_order_quantity: 1,
    description: 'Ergonomic medical shoes designed for long shifts.',
    is_active: true,
    is_new: false,
    is_featured: false,
    meta_title: 'Comfortable Medical Shoes',
    meta_description: 'Professional medical footwear for healthcare workers',
    meta_keywords: 'shoes, medical, comfortable, healthcare',
    $createdAt: new Date().toISOString(),
    $updatedAt: new Date().toISOString()
  }
];

// Check if Appwrite is available
export const checkAppwriteConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/health`,
      {
        method: 'GET',
        headers: {
          'X-Appwrite-Project': process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || ''
        }
      }
    );
    return response.ok;
  } catch (error) {
    console.error('Appwrite connection check failed:', error);
    return false;
  }
};

// Get categories with fallback
export const getCategoriesWithFallback = async (): Promise<{ categories: FallbackCategory[], fallback: boolean }> => {
  try {
    const response = await fetch('/api/admin/categories?status=true');
    if (response.ok) {
      const data = await response.json();
      return { categories: data.categories || [], fallback: data.fallback || false };
    }
    throw new Error('API request failed');
  } catch (error) {
    console.error('Using fallback categories:', error);
    return { categories: fallbackCategories, fallback: true };
  }
};

// Get brands with fallback
export const getBrandsWithFallback = async (): Promise<{ brands: FallbackBrand[], fallback: boolean }> => {
  try {
    const response = await fetch('/api/admin/brands?status=true');
    if (response.ok) {
      const data = await response.json();
      return { brands: data.brands || [], fallback: data.fallback || false };
    }
    throw new Error('API request failed');
  } catch (error) {
    console.error('Using fallback brands:', error);
    return { brands: fallbackBrands, fallback: true };
  }
};

// Get products with fallback
export const getProductsWithFallback = async (): Promise<{ products: FallbackProduct[], fallback: boolean }> => {
  try {
    const response = await fetch('/api/admin/products?available=true&limit=100');
    if (response.ok) {
      const data = await response.json();
      return { products: data.products || [], fallback: data.fallback || false };
    }
    throw new Error('API request failed');
  } catch (error) {
    console.error('Using fallback products:', error);
    return { products: fallbackProducts, fallback: true };
  }
};