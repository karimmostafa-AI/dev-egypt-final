'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '../../components/MainLayout';
import { Product } from '../../types/product';
import { ChevronDown, Filter, X, Star, Heart } from 'lucide-react';
import Image from 'next/image';

interface Category {
  $id: string;
  name: string;
  status: boolean;
}

interface Brand {
  $id: string;
  name: string;
  prefix: string;
  status: boolean;
}

interface Filters {
  categories: string[];
  brands: string[];
  priceRange: [number, number];
  showFeatured: boolean;
  showNew: boolean;
  showOnSale: boolean;
}

export default function CatalogPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'price-low' | 'price-high' | 'newest'>('name');
  
  // Filter states
  const [filters, setFilters] = useState<Filters>({
    categories: [],
    brands: [],
    priceRange: [0, 1000],
    showFeatured: false,
    showNew: false,
    showOnSale: false
  });
  
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [maxPrice, setMaxPrice] = useState(1000);

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch('/api/admin/products?available=true&limit=100', {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        console.error('Error fetching products:', data.error);
        return;
      }

      const fetchedProducts = data.products || [];
      setProducts(fetchedProducts);
      
      // Calculate max price for price range filter
      if (fetchedProducts.length > 0) {
        const prices = fetchedProducts.map((p: Product) => p.price);
        const maxProductPrice = Math.max(...prices);
        const roundedMax = Math.ceil(maxProductPrice / 50) * 50; // Round up to nearest 50
        setMaxPrice(roundedMax);
        setPriceRange([0, roundedMax]);
        setFilters(prev => ({ ...prev, priceRange: [0, roundedMax] }));
      }
    } catch (error: any) {
      console.error('Failed to fetch products:', error.message || error);
      // Use fallback products when API fails
      const fallbackProducts: Product[] = [
        {
          $id: 'fallback-p1',
          name: 'Dev Egypt Professional Scrub Top',
          slug: 'dev-egypt-professional-scrub-top',
          price: 299,
          discount_price: 249,
          category_id: 'fallback-c1',
          brand_id: 'fallback-b1',
          units: 1,
          min_order_quantity: 1,
          is_featured: true,
          is_new: true,
          is_active: true,
          media_id: 'https://via.placeholder.com/300x400?text=Scrub+Top',
          description: 'High-quality professional scrub top',
          meta_title: 'Dev Egypt Professional Scrub Top',
          meta_description: 'High-quality professional scrub top for healthcare workers',
          meta_keywords: 'scrub top, medical scrubs, professional',
          $createdAt: new Date().toISOString(),
          $updatedAt: new Date().toISOString()
        },
        {
          $id: 'fallback-p2',
          name: 'Dev Egypt Comfortable Scrub Pants',
          slug: 'dev-egypt-comfortable-scrub-pants',
          price: 199,
          discount_price: 0,
          category_id: 'fallback-c2',
          brand_id: 'fallback-b1',
          units: 1,
          min_order_quantity: 1,
          is_featured: false,
          is_new: false,
          is_active: true,
          media_id: 'https://via.placeholder.com/300x400?text=Scrub+Pants',
          description: 'Comfortable and durable scrub pants',
          meta_title: 'Dev Egypt Comfortable Scrub Pants',
          meta_description: 'Comfortable and durable scrub pants for all-day wear',
          meta_keywords: 'scrub pants, medical scrubs, comfortable',
          $createdAt: new Date().toISOString(),
          $updatedAt: new Date().toISOString()
        },
        {
          $id: 'fallback-p3',
          name: 'Cherokee Classic Scrub Set',
          slug: 'cherokee-classic-scrub-set',
          price: 449,
          discount_price: 399,
          category_id: 'fallback-c3',
          brand_id: 'fallback-b2',
          units: 1,
          min_order_quantity: 1,
          is_featured: true,
          is_new: false,
          is_active: true,
          media_id: 'https://via.placeholder.com/300x400?text=Scrub+Set',
          description: 'Complete professional scrub set',
          meta_title: 'Cherokee Classic Scrub Set',
          meta_description: 'Complete professional scrub set with top and pants',
          meta_keywords: 'scrub set, cherokee, professional scrubs',
          $createdAt: new Date().toISOString(),
          $updatedAt: new Date().toISOString()
        }
      ];
      setProducts(fallbackProducts);
      setMaxPrice(500);
      setPriceRange([0, 500]);
      setFilters(prev => ({ ...prev, priceRange: [0, 500] }));
    }
  };

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch('/api/admin/categories?status=true', {
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        console.error('Error fetching categories:', data.error);
        return;
      }

      setCategories(data.categories || []);
    } catch (error: any) {
      console.error('Failed to fetch categories:', error.message || error);
      // Use fallback categories when API fails
      setCategories([
        { $id: 'fallback-c1', name: 'Scrub Tops', status: true },
        { $id: 'fallback-c2', name: 'Scrub Pants', status: true },
        { $id: 'fallback-c3', name: 'Scrub Sets', status: true },
        { $id: 'fallback-c4', name: 'Lab Coats', status: true },
        { $id: 'fallback-c5', name: 'Accessories', status: true }
      ]);
    }
  };

  // Fetch brands from API
  const fetchBrands = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch('/api/admin/brands?status=true', {
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        console.error('Error fetching brands:', data.error);
        return;
      }

      setBrands(data.brands || []);
    } catch (error: any) {
      console.error('Failed to fetch brands:', error.message || error);
      // Use fallback brands when API fails
      setBrands([
        { $id: 'fallback-b1', name: 'Dev Egypt', prefix: 'DE', status: true },
        { $id: 'fallback-b2', name: 'Cherokee', prefix: 'CHE', status: true },
        { $id: 'fallback-b3', name: 'WonderWink', prefix: 'WW', status: true },
        { $id: 'fallback-b4', name: 'FIGS', prefix: 'FIGS', status: true },
        { $id: 'fallback-b5', name: 'Jaanuu', prefix: 'JAN', status: true }
      ]);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchProducts(), fetchCategories(), fetchBrands()]);
      setLoading(false);
    };
    
    loadData();
  }, []);
  
  // Handle URL parameters
  useEffect(() => {
    if (!loading && categories.length > 0) {
      const categoryParam = searchParams.get('category');
      const brandParam = searchParams.get('brand');
      const featuredParam = searchParams.get('featured');
      const newParam = searchParams.get('new');
      const saleParam = searchParams.get('sale');
      
      setFilters(prev => ({
        ...prev,
        categories: categoryParam ? [categoryParam] : [],
        brands: brandParam ? [brandParam] : [],
        showFeatured: featuredParam === 'true',
        showNew: newParam === 'true',
        showOnSale: saleParam === 'true'
      }));
    }
  }, [searchParams, loading, categories]);

  // Get brand name by ID
  const getBrandName = (brandId: string) => {
    const brand = brands.find(b => b.$id === brandId);
    return brand ? brand.name : 'Unknown Brand';
  };

  // Get category name by ID
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.$id === categoryId);
    return category ? category.name : 'Unknown Category';
  };

  // Helper function to determine if media_id is a URL or Appwrite file ID
  const getImageSrc = (mediaId: string) => {
    // Check if it's a URL (starts with http:// or https://)
    if (mediaId.startsWith('http://') || mediaId.startsWith('https://')) {
      return mediaId;
    }
    // Otherwise, treat it as an Appwrite file ID
    return `/api/storage/files/${mediaId}/view`;
  };

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    const filtered = products.filter(product => {
      // Category filter
      if (filters.categories.length > 0 && !filters.categories.includes(product.category_id)) {
        return false;
      }
      
      // Brand filter
      if (filters.brands.length > 0 && !filters.brands.includes(product.brand_id)) {
        return false;
      }
      
      // Price range filter
      const price = product.discount_price > 0 ? product.discount_price : product.price;
      if (price < filters.priceRange[0] || price > filters.priceRange[1]) {
        return false;
      }
      
      // Featured filter
      if (filters.showFeatured && !product.is_featured) {
        return false;
      }
      
      // New products filter
      if (filters.showNew && !product.is_new) {
        return false;
      }
      
      // On sale filter
      if (filters.showOnSale && !(product.discount_price > 0 && product.discount_price < product.price)) {
        return false;
      }
      
      return true;
    });
    
    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          const priceA = a.discount_price > 0 ? a.discount_price : a.price;
          const priceB = b.discount_price > 0 ? b.discount_price : b.price;
          return priceA - priceB;
        case 'price-high':
          const priceA2 = a.discount_price > 0 ? a.discount_price : a.price;
          const priceB2 = b.discount_price > 0 ? b.discount_price : b.price;
          return priceB2 - priceA2;
        case 'newest':
          return new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime();
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });
    
    return filtered;
  }, [products, filters, sortBy]);
  
  // Filter handlers
  const toggleCategoryFilter = (categoryId: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId]
    }));
  };
  
  const toggleBrandFilter = (brandId: string) => {
    setFilters(prev => ({
      ...prev,
      brands: prev.brands.includes(brandId)
        ? prev.brands.filter(id => id !== brandId)
        : [...prev.brands, brandId]
    }));
  };
  
  const updatePriceRange = (min: number, max: number) => {
    setPriceRange([min, max]);
    setFilters(prev => ({ ...prev, priceRange: [min, max] }));
  };
  
  const toggleSpecialFilter = (filterType: 'showFeatured' | 'showNew' | 'showOnSale') => {
    setFilters(prev => ({ ...prev, [filterType]: !prev[filterType] }));
  };
  
  const clearAllFilters = () => {
    setFilters({
      categories: [],
      brands: [],
      priceRange: [0, maxPrice],
      showFeatured: false,
      showNew: false,
      showOnSale: false
    });
    setPriceRange([0, maxPrice]);
  };
  
  const activeFiltersCount = filters.categories.length + filters.brands.length + 
    (filters.showFeatured ? 1 : 0) + (filters.showNew ? 1 : 0) + (filters.showOnSale ? 1 : 0) +
    ((filters.priceRange[0] !== 0 || filters.priceRange[1] !== maxPrice) ? 1 : 0);
    
  // Get page title based on current filters
  const getPageTitle = () => {
    if (filters.showFeatured) return 'Featured Products';
    if (filters.showNew) return 'New & Trending';
    if (filters.showOnSale) return 'Sale Products';
    if (filters.categories.length === 1) {
      const category = categories.find(c => c.$id === filters.categories[0]);
      return category ? category.name : 'Product Catalog';
    }
    if (filters.brands.length === 1) {
      const brand = brands.find(b => b.$id === filters.brands[0]);
      return brand ? `${brand.name} Products` : 'Product Catalog';
    }
    return 'Product Catalog';
  };

  const LoadingSkeleton = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1920px] mx-auto px-[50px] py-8">
        <div className="flex gap-8">
          {/* Sidebar Skeleton */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Products Grid Skeleton */}
          <div className="flex-1">
            <div className="mb-6 flex justify-between items-center">
              <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg overflow-hidden shadow-sm border animate-pulse">
                  <div className="h-64 bg-gray-200"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <MainLayout>
      {loading ? (
        <LoadingSkeleton />
      ) : (
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-[1920px] mx-auto px-[50px] py-8">
            <div className="flex gap-8">
              {/* Mobile Filter Toggle */}
              <div className="lg:hidden fixed top-20 right-4 z-50">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="bg-[#173a6a] text-white p-3 rounded-full shadow-lg hover:bg-[#1e4a7a] transition-colors"
                >
                  <Filter className="h-5 w-5" />
                  {activeFiltersCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Sidebar */}
              <div className={`w-80 flex-shrink-0 ${sidebarOpen ? 'fixed inset-y-0 left-0 z-40 lg:relative lg:inset-auto' : 'hidden lg:block'}`}>
                <div className="bg-white rounded-lg shadow-sm h-fit sticky top-8">
                  {/* Mobile close button */}
                  <div className="lg:hidden flex justify-between items-center p-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="p-6">
                    {/* Filter Header */}
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-semibold text-gray-900 hidden lg:block">Filters</h2>
                      {activeFiltersCount > 0 && (
                        <button
                          onClick={clearAllFilters}
                          className="text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                          Clear All ({activeFiltersCount})
                        </button>
                      )}
                    </div>

                    {/* Special Filters */}
                    <div className="mb-8">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Special</h3>
                      <div className="space-y-3">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.showFeatured}
                            onChange={() => toggleSpecialFilter('showFeatured')}
                            className="rounded border-gray-300 text-[#173a6a] focus:ring-[#173a6a] focus:ring-offset-0"
                          />
                          <span className="text-sm text-gray-700">Featured Products</span>
                          <Star className="h-4 w-4 text-yellow-400" />
                        </label>
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.showNew}
                            onChange={() => toggleSpecialFilter('showNew')}
                            className="rounded border-gray-300 text-[#173a6a] focus:ring-[#173a6a] focus:ring-offset-0"
                          />
                          <span className="text-sm text-gray-700">New Products</span>
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">New</span>
                        </label>
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.showOnSale}
                            onChange={() => toggleSpecialFilter('showOnSale')}
                            className="rounded border-gray-300 text-[#173a6a] focus:ring-[#173a6a] focus:ring-offset-0"
                          />
                          <span className="text-sm text-gray-700">On Sale</span>
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">Sale</span>
                        </label>
                      </div>
                    </div>

                    {/* Categories Filter */}
                    <div className="mb-8">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Categories</h3>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {categories.map((category) => (
                          <label key={category.$id} className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={filters.categories.includes(category.$id)}
                              onChange={() => toggleCategoryFilter(category.$id)}
                              className="rounded border-gray-300 text-[#173a6a] focus:ring-[#173a6a] focus:ring-offset-0"
                            />
                            <span className="text-sm text-gray-700">{category.name}</span>
                            <span className="text-xs text-gray-500">(
                              {products.filter(p => p.category_id === category.$id).length}
                            )</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Brands Filter */}
                    <div className="mb-8">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Brands</h3>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {brands.map((brand) => (
                          <label key={brand.$id} className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={filters.brands.includes(brand.$id)}
                              onChange={() => toggleBrandFilter(brand.$id)}
                              className="rounded border-gray-300 text-[#173a6a] focus:ring-[#173a6a] focus:ring-offset-0"
                            />
                            <span className="text-sm text-gray-700">{brand.name}</span>
                            <span className="text-xs text-gray-500 font-mono">({brand.prefix})</span>
                            <span className="text-xs text-gray-500">(
                              {products.filter(p => p.brand_id === brand.$id).length}
                            )</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Price Range Filter */}
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Price Range</h3>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">Min</label>
                            <input
                              type="number"
                              value={priceRange[0]}
                              onChange={(e) => updatePriceRange(Number(e.target.value), priceRange[1])}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#173a6a] focus:border-[#173a6a]"
                              min="0"
                              max={maxPrice}
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">Max</label>
                            <input
                              type="number"
                              value={priceRange[1]}
                              onChange={(e) => updatePriceRange(priceRange[0], Number(e.target.value))}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#173a6a] focus:border-[#173a6a]"
                              min="0"
                              max={maxPrice}
                            />
                          </div>
                        </div>
                        <div className="text-center text-sm text-gray-600">
                          ${priceRange[0]} - ${priceRange[1]}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Overlay for mobile */}
              {sidebarOpen && (
                <div
                  className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
                  onClick={() => setSidebarOpen(false)}
                />
              )}

              {/* Main Content */}
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">{getPageTitle()}</h1>
                      <p className="text-gray-600">
                        {filteredAndSortedProducts.length} {filteredAndSortedProducts.length === 1 ? 'product' : 'products'} found
                      </p>
                    </div>
                    
                    {/* Sort Dropdown */}
                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[#173a6a] focus:border-[#173a6a]"
                      >
                        <option value="name">Sort by Name</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                        <option value="newest">Newest First</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  
                  {/* Active Filters */}
                  {activeFiltersCount > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {filters.categories.map(catId => {
                        const category = categories.find(c => c.$id === catId);
                        return category ? (
                          <span key={catId} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-[#173a6a] text-white">
                            {category.name}
                            <button onClick={() => toggleCategoryFilter(catId)} className="hover:bg-white hover:bg-opacity-20 rounded-full p-0.5">
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ) : null;
                      })}
                      {filters.brands.map(brandId => {
                        const brand = brands.find(b => b.$id === brandId);
                        return brand ? (
                          <span key={brandId} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-[#173a6a] text-white">
                            {brand.name}
                            <button onClick={() => toggleBrandFilter(brandId)} className="hover:bg-white hover:bg-opacity-20 rounded-full p-0.5">
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ) : null;
                      })}
                      {filters.showFeatured && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
                          Featured
                          <button onClick={() => toggleSpecialFilter('showFeatured')} className="hover:bg-yellow-200 rounded-full p-0.5">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      )}
                      {filters.showNew && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                          New Products
                          <button onClick={() => toggleSpecialFilter('showNew')} className="hover:bg-blue-200 rounded-full p-0.5">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      )}
                      {filters.showOnSale && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-red-100 text-red-800">
                          On Sale
                          <button onClick={() => toggleSpecialFilter('showOnSale')} className="hover:bg-red-200 rounded-full p-0.5">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Products Grid - 3 Columns */}
                {filteredAndSortedProducts.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-gray-400 text-4xl mb-4">📦</div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No products found</h3>
                    <p className="text-gray-600 mb-4">Try adjusting your filters to see more products.</p>
                    {activeFiltersCount > 0 && (
                      <button
                        onClick={clearAllFilters}
                        className="text-[#173a6a] hover:text-[#1e4a7a] font-medium"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAndSortedProducts.map((product) => (
                      <Link key={product.$id} href={`/product/${product.slug}`} className="bg-white rounded-lg overflow-hidden shadow-sm border hover:shadow-lg transition-all duration-300 group block">
                        {/* Product Image */}
                        <div className="relative h-64 bg-gray-100 flex items-center justify-center overflow-hidden">
                          {product.media_id ? (
                            <Image
                              src={getImageSrc(product.media_id)}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              width={300} 
                              height={300}
                              onError={(e) => {
                                // Fallback to placeholder if image fails to load
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          {/* Fallback icon - shown if no media_id or image fails to load */}
                          <div className={`text-gray-400 text-4xl fallback-icon ${product.media_id ? 'hidden' : ''}`}>📦</div>
                          
                          {/* Badges */}
                          <div className="absolute top-3 left-3 flex flex-col gap-2">
                            {product.is_featured && (
                              <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                                <Star className="h-3 w-3" />
                                Featured
                              </span>
                            )}
                            {product.is_new && (
                              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                New
                              </span>
                            )}
                            {product.discount_price > 0 && product.discount_price < product.price && (
                              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                                Sale
                              </span>
                            )}
                          </div>
                          
                          {/* Wishlist Button */}
                          <button className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-gray-50">
                            <Heart className="h-4 w-4 text-gray-600" />
                          </button>
                        </div>
                        
                        {/* Product Details */}
                        <div className="p-4">
                          <div className="mb-2">
                            <p className="text-sm text-gray-600 mb-1">
                              {getBrandName(product.brand_id)}
                            </p>
                            <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-[#173a6a] transition-colors">
                              {product.name}
                            </h3>
                          </div>
                          
                          {/* Price */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-2">
                              {product.discount_price > 0 && product.discount_price < product.price ? (
                                <>
                                  <span className="text-lg font-bold text-red-600">
                                    ${product.discount_price.toFixed(2)}
                                  </span>
                                  <span className="text-sm text-gray-500 line-through">
                                    ${product.price.toFixed(2)}
                                  </span>
                                </>
                              ) : (
                                <span className="text-lg font-bold text-gray-900">
                                  ${product.price.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Add to Cart Button */}
                          <button className="w-full bg-[#173a6a] text-white py-3 px-4 rounded-md hover:bg-[#1e4a7a] transition-colors font-medium text-sm">
                            Add to Cart
                          </button>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
