'use client';

import React, { useState, useEffect } from 'react'
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '../src/context/CartContext';
import { useLocationShipping } from '../src/contexts/LocationContext';
import { usePathname } from 'next/navigation';

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

interface NewBrand {
  id: string;
  name: string;
  subcategories: string[];
}

export default function Nav() {
  const { getCartCount } = useCart();
  const { shipToText, isLoading: locationLoading } = useLocationShipping();
  const pathname = usePathname();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [hoverBrand, setHoverBrand] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null); // No default selection

  // Professional brand structure (only 3 brands - Dev Egypt is the main site)
  const newBrands: NewBrand[] = [
    {
      id: 'omaima',
      name: 'OMAIMA',
      subcategories: ['Uniform', 'Medical', 'Formal wear']
    },
    {
      id: 'hleo',
      name: 'H LEO',
      subcategories: ['Oversize', 'Coming Soon!']
    },
    {
      id: 'seen',
      name: 'SEEN',
      subcategories: ['Slim', 'Coming Soon!', 'Coming Soon!', 'Coming Soon!']
    }
  ];

  const handleBrandClick = (brandId: string) => {
    setSelectedBrand(brandId);
    // Navigate to brand-specific pages
    switch (brandId) {
      case 'omaima':
        router.push('/omaima');
        break;
      case 'hleo':
        // Will be implemented later
        router.push('/catalog?brand=hleo');
        break;
      case 'seen':
        // Will be implemented later
        router.push('/catalog?brand=seen');
        break;
      default:
        router.push('/catalog');
    }
  };

  // Fetch brands from API with enhanced error handling
  const fetchBrands = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch('/api/admin/brands?status=true', {
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
        console.error('Error fetching brands:', data.error);
        throw new Error(data.error);
      }

      // If we have valid brand data, use it
      if (data.brands && Array.isArray(data.brands)) {
        setBrands(data.brands);
      } else {
        throw new Error('Invalid brand data structure');
      }
    } catch (error: any) {
      console.warn('API unavailable, using fallback brands:', error.message || error);
      // Enhanced fallback with proper TypeScript interfaces
      const fallbackBrands: Brand[] = [
        { $id: 'omaima-fallback', name: 'OMAIMA', prefix: 'OMA', status: true },
        { $id: 'hleo-fallback', name: 'H LEO', prefix: 'HL', status: true },
        { $id: 'seen-fallback', name: 'SEEN', prefix: 'SEEN', status: true },
        { $id: 'dev-egypt-fallback', name: 'Dev Egypt', prefix: 'DE', status: true },
        { $id: 'cherokee-fallback', name: 'Cherokee', prefix: 'CHE', status: true },
        { $id: 'wonderwink-fallback', name: 'WonderWink', prefix: 'WW', status: true }
      ];
      setBrands(fallbackBrands);
    } finally {
      setBrandsLoading(false);
    }
  };

  // Fetch categories from API with enhanced error handling
  const fetchCategories = async () => {
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch('/api/admin/categories?status=true', {
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
        console.error('Error fetching categories:', data.error);
        throw new Error(data.error);
      }

      // If we have valid category data, use it
      if (data.categories && Array.isArray(data.categories)) {
        setCategories(data.categories);
      } else {
        throw new Error('Invalid category data structure');
      }
    } catch (error: any) {
      console.warn('API unavailable, using fallback categories:', error.message || error);
      // Enhanced fallback with proper TypeScript interfaces
      const fallbackCategories: Category[] = [
        { $id: 'women-fallback', name: 'Women', status: true },
        { $id: 'men-fallback', name: 'Men', status: true },
        { $id: 'scrubs-fallback', name: 'Scrubs', status: true },
        { $id: 'uniforms-fallback', name: 'Uniforms', status: true },
        { $id: 'medical-fallback', name: 'Medical', status: true },
        { $id: 'formal-fallback', name: 'Formal', status: true }
      ];
      setCategories(fallbackCategories);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch both categories and brands
    fetchCategories();
    fetchBrands();
  }, []);

  // Set selected brand based on current pathname
  useEffect(() => {
    if (pathname === '/omaima') {
      setSelectedBrand('omaima');
    } else if (pathname.includes('hleo')) {
      setSelectedBrand('hleo');
    } else if (pathname.includes('seen')) {
      setSelectedBrand('seen');
    } else {
      setSelectedBrand(null);
    }
  }, [pathname]);

  return (
    <header className="w-full mx-auto shadow-xl">
      {/* Top black bar with the 3 brands */}
      <div className="w-full bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
          <div className="h-12 flex items-center justify-between">
            {/* The 3 Brands with White Selection */}
            <div className="flex items-center gap-4">
              {newBrands.map((brand, index) => (
                <button
                  key={brand.id}
                  onClick={() => handleBrandClick(brand.id)}
                  className={`relative px-6 py-2 font-bold text-sm tracking-wider transition-all duration-500 transform hover:scale-110 ${
                    selectedBrand === brand.id
                      ? 'bg-white text-black shadow-lg scale-105'
                      : 'text-white hover:text-red-400'
                  }`}
                  style={{
                    animationDelay: `${index * 100}ms`
                  }}
                >
                  {brand.name}
                  {/* White glow effect for selected brand */}
                  {selectedBrand === brand.id && (
                    <>
                      <div className="absolute inset-0 bg-white opacity-20 animate-ping"></div>
                      <div className="absolute -inset-1 bg-white/30 blur opacity-50 animate-pulse"></div>
                    </>
                  )}
                </button>
              ))}
            </div>
            
            {/* Right side utility links */}
            <div className="flex items-center gap-6 text-sm">
              <span className="hover:text-red-400 transition-colors cursor-pointer">🇪🇬 Egypt | العربية</span>
              <span className="hover:text-red-400 transition-colors cursor-pointer">Groups</span>
              <span className="hover:text-red-400 transition-colors cursor-pointer">Store Locator</span>
              <span className="hover:text-red-400 transition-colors cursor-pointer">Tracking</span>
              <span className="hover:text-red-400 transition-colors cursor-pointer">Help</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main white navigation */}
      <div className="w-full bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo - Dev Egypt (main site name) */}
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-4 group">
                <div className="w-16 h-16 bg-black text-white flex items-center justify-center text-2xl font-bold transform group-hover:scale-110 transition-all duration-500">
                  <span>DE</span>
                </div>
                <div className="relative">
                  <div className="text-4xl font-bold text-black group-hover:scale-105 transition-transform duration-300">
                    Dev Egypt<sup className="text-sm">®</sup>
                  </div>
                  <div className="text-sm text-gray-600 -mt-1">Premium Collections</div>
                </div>
              </Link>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-12">
              <div className="relative group">
                <div className="w-full h-12 border-2 border-gray-300 flex items-center px-6 text-lg bg-white group-focus-within:border-red-500 hover:border-gray-400 transition-all duration-300 shadow-md">
                  <svg className="w-6 h-6 text-gray-400 mr-4 group-focus-within:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input 
                    aria-label="Search" 
                    placeholder="Search for products..." 
                    className="w-full outline-none text-gray-700 placeholder-gray-400 bg-transparent text-lg" 
                  />
                  <button className="ml-4 px-6 py-2 bg-red-600 text-white font-medium hover:bg-red-700 transform hover:scale-105 transition-all duration-300">
                    Search
                  </button>
                </div>
              </div>
            </div>

            {/* Account & Cart */}
            <div className="flex items-center gap-6">
              <Link 
                href="/account" 
                className="group flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all duration-300 transform hover:scale-105"
              >
                <svg className="w-6 h-6 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="font-medium">Account</span>
              </Link>
              
              <Link 
                href="/cart" 
                className="group flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all duration-300 transform hover:scale-105 relative"
              >
                <svg className="w-6 h-6 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13v8m0-8h10m0 0v8a2 2 0 01-2 2H9a2 2 0 01-2-2v-8z" />
                </svg>
                <span className="font-medium">Cart</span>
                {getCartCount() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-sm rounded-full h-6 w-6 flex items-center justify-center font-bold animate-pulse">
                    {getCartCount()}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main navigation menu - Categories */}
      <div className="w-full bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-center h-14">
            <div className="flex items-center gap-12">
              {/* WOMEN */}
              <Link href="/catalog?category=women" className="text-black font-medium hover:text-red-600 transition-colors">
                WOMEN
              </Link>
              
              {/* MEN */}
              <Link href="/catalog?category=men" className="text-black font-medium hover:text-red-600 transition-colors">
                MEN
              </Link>
              
              {/* BRANDS with dropdown */}
              <div 
                className="relative group"
                onMouseEnter={() => setHoverBrand('brands')}
                onMouseLeave={() => setHoverBrand(null)}
              >
                <Link 
                  href="/catalog?brands=all" 
                  className="text-black font-medium hover:text-red-600 transition-colors flex items-center gap-1"
                >
                  BRANDS
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Link>
                
                {/* Brands Dropdown */}
                <div className={`absolute top-full left-1/2 transform -translate-x-1/2 w-80 bg-white border border-gray-200 shadow-lg z-50 transition-all duration-200 ${
                  hoverBrand === 'brands'
                    ? 'opacity-100 visible translate-y-0'
                    : 'opacity-0 invisible -translate-y-2'
                }`}>
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-6">
                      {newBrands.map((brand) => (
                        <div key={brand.id} className="space-y-2">
                          <h3 className="font-bold text-black text-base border-b border-gray-200 pb-1">
                            {brand.name}
                          </h3>
                          <div className="space-y-1">
                            {brand.subcategories.map((subcat, idx) => (
                              <div key={idx}>
                                {subcat === '-----' ? (
                                  <div className="text-gray-400 text-sm italic py-1">More collections coming soon...</div>
                                ) : subcat === 'Coming Soon!' ? (
                                  <div className="text-red-600 text-sm font-medium py-1 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                    </svg>
                                    {subcat}
                                  </div>
                                ) : (
                                  <Link
                                    href={`/catalog?brand=${brand.id}&category=${subcat.toLowerCase().replace(' ', '-')}`}
                                    className="block text-gray-600 hover:text-red-600 text-sm py-1 transition-colors"
                                  >
                                    {subcat}
                                  </Link>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* SCRUBS */}
              <Link href="/catalog?category=scrubs" className="text-black font-medium hover:text-red-600 transition-colors">
                SCRUBS
              </Link>
              
              {/* PRINTS */}
              <Link href="/catalog?category=prints" className="text-black font-medium hover:text-red-600 transition-colors">
                PRINTS
              </Link>
              
              {/* FOOTWEAR */}
              <Link href="/catalog?category=footwear" className="text-black font-medium hover:text-red-600 transition-colors">
                FOOTWEAR
              </Link>
              
              {/* ACCESSORIES */}
              <Link href="/catalog?category=accessories" className="text-black font-medium hover:text-red-600 transition-colors">
                ACCESSORIES
              </Link>
              
              {/* NEW & TRENDING */}
              <Link href="/catalog?new=true" className="text-black font-medium hover:text-red-600 transition-colors">
                NEW & TRENDING
              </Link>
              
              {/* SALE - Red color */}
              <Link href="/catalog?sale=true" className="text-red-600 font-bold hover:text-red-700 transition-colors">
                SALE
              </Link>
            </div>
          </nav>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx global>{`
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes expand {
          0% { width: 0; }
          100% { width: 6rem; }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        .animate-expand {
          animation: expand 0.8s ease-out;
        }
      `}</style>
    </header>
  )
}

