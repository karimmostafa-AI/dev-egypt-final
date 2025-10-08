/**
 * Example: Enhanced Navigation with Location Selector
 * 
 * This example shows how to integrate the LocationSelector component
 * into your existing navigation for easy location/currency switching.
 */

'use client';

import React, { useState, useEffect } from 'react'
import Link from 'next/link';
import { useCart } from '../src/context/CartContext';
import { useLocationShipping } from '../src/contexts/LocationContext';
import LocationSelector from '../src/components/LocationSelector';

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

export default function EnhancedNav() {
  const { getCartCount } = useCart();
  const { shipToText, isLoading: locationLoading } = useLocationShipping();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [showLocationSelector, setShowLocationSelector] = useState(false);

  // ... existing fetch functions (same as your current nav) ...

  return (
    <header className="w-[1920px] max-w-full mx-auto">
      {/* Top black utility/brand bar */}
      <div className="w-full" style={{ backgroundColor: '#000000' }}>
        <div className="px-[50px] mx-auto text-white">
          <div className="h-[36px] flex items-center justify-between text-[12px]">
            <div className="flex items-center gap-6 opacity-90">
              {brandsLoading ? (
                // Loading skeleton for brands
                <>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-3 bg-gray-600 rounded w-16 animate-pulse"></div>
                  ))}
                </>
              ) : (
                brands.slice(0, 5).map((brand) => (
                  <Link
                    key={brand.$id}
                    href={`/catalog?brand=${brand.$id}`}
                    className="hover:opacity-70 transition-opacity cursor-pointer"
                    title={`Shop ${brand.name} products`}
                  >
                    {brand.name.toUpperCase()}
                  </Link>
                ))
              )}
            </div>
            
            {/* Enhanced location section with dropdown */}
            <div className="flex items-center gap-4 opacity-90">
              <div className="relative">
                {locationLoading ? (
                  <div className="h-3 bg-gray-600 rounded w-32 animate-pulse"></div>
                ) : (
                  <button
                    onClick={() => setShowLocationSelector(!showLocationSelector)}
                    className="hover:opacity-70 transition-opacity cursor-pointer flex items-center gap-1"
                    title="Change location and currency"
                  >
                    <span>{shipToText} | Español</span>
                    <svg 
                      className={`w-3 h-3 transition-transform ${showLocationSelector ? 'rotate-180' : ''}`} 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
                
                {/* Location Selector Dropdown */}
                {showLocationSelector && (
                  <div className="absolute top-full right-0 mt-2 z-50">
                    <div className="bg-white rounded-lg shadow-lg border">
                      <LocationSelector 
                        compact 
                        className="w-80"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <span>Groups</span>
              <span>Store Locator</span>
              <span>Tracking</span>
              <span>Help</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle row: logo + search + account/cart */}
      <div className="px-[50px] mx-auto">
        <div className="flex items-center justify-between w-full h-[62px] gap-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-[46px] h-[46px] bg-[#173a6a] text-white flex items-center justify-center text-[18px] font-bold">DE</div>
              <div className="text-[28px] tracking-[-0.02em]">Dev Egypt</div>
            </Link>
          </div>
          
          <div className="flex-1 max-w-[760px] mx-8">
            <div className="w-full h-[40px] border border-[#ddd] rounded-[6px] flex items-center px-3 text-[14px] text-[#666]">
              <span className="mr-2">🔍</span>
              <input aria-label="Search" placeholder="Search (keywords,etc)" className="w-full outline-none" />
            </div>
          </div>
          
          <div className="flex items-center gap-6 text-[18px]">
            <Link href="/account" title="Account" aria-label="Account">
              <span>👤</span>
            </Link>
            
            <Link href="/cart" title="Cart" aria-label="Cart" className="relative">
              <span>🛍️</span>
              {getCartCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {getCartCount()}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom categories menu */}
      <div className="px-[50px] mx-auto">
        <nav className="flex items-center gap-10 h-[56px] text-[16px]">
          {/* All Products Link */}
          <Link href="/catalog" className="hover:opacity-80 transition-opacity">
            ALL PRODUCTS
          </Link>
          
          {/* Dynamic Categories */}
          {loading ? (
            // Loading skeleton
            <>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
              ))}
            </>
          ) : (
            categories.slice(0, 8).map((category) => (
              <Link 
                key={category.$id} 
                href={`/catalog?category=${category.$id}`} 
                className="hover:opacity-80 transition-opacity"
              >
                {category.name.toUpperCase()}
              </Link>
            ))
          )}
          
          {/* Special Links */}
          <Link href="/catalog?featured=true" className="hover:opacity-80 transition-opacity">
            FEATURED
          </Link>
          <Link href="/catalog?new=true" className="hover:opacity-80 transition-opacity">
            NEW & TRENDING
          </Link>
          <Link href="/catalog?sale=true" className="text-[#D0011B] font-medium hover:opacity-80 transition-opacity">
            SALE
          </Link>
        </nav>
      </div>

      {/* Close dropdown when clicking outside */}
      {showLocationSelector && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowLocationSelector(false)}
        />
      )}

      {/* Border promo band */}
      <div className="w-[1920px] max-w-full mx-auto px-[260px]" style={{ paddingTop: 1, paddingBottom: 10.62 }}>
        <div className="w-full border-t" style={{ borderColor: '#DDDDDD' }} />
        <div className="flex items-center justify-center gap-4 py-4 text-[12px]">
          <div className="flex flex-col items-center">
            <div>Use Code: LOVE20 for 20% off Scrubs*</div>
            <div className="text-[12px] opacity-70">Exclusion Apply, Ends 9/29/25</div>
          </div>
          <div className="w-px h-[40px] bg-[#DDDDDD]" />
          <div className="flex flex-col items-center">
            <div>Up to 25% off NEW Fall Prints</div>
            <div className="text-[12px] opacity-70">Including the Halloween Shop, ends 9/29/25</div>
          </div>
          <div className="w-px h-[38px] bg-[#DDDDDD]" />
          <div className="flex flex-col items-center">
            <div>Use Code: LOVE20 for 20% off Shoes*</div>
            <div className="text-[12px] opacity-70">Exclusion Apply, Ends 9/29/25</div>
          </div>
        </div>
      </div>
    </header>
  )
}

/**
 * Integration Notes:
 * 
 * 1. The location text now includes a dropdown arrow and is clickable
 * 2. Clicking opens a compact LocationSelector component
 * 3. The dropdown is positioned absolutely and closes when clicking outside
 * 4. Location changes immediately update the navigation text
 * 5. Currency changes are reflected in all CurrencyConverter components
 * 
 * To use this enhanced navigation:
 * - Replace your existing Nav component with this one
 * - Or copy the location selector dropdown code into your existing nav
 * - Make sure LocationProvider is in your root layout (already done)
 * 
 * The compact LocationSelector provides:
 * - Country/currency selection with flags
 * - Search functionality
 * - Popular countries section
 * - Auto-detect location button
 * - Immediate updates to navigation and currency
 */
