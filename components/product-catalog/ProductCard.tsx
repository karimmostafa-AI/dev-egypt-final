'use client';

import { useState, memo, useCallback, useMemo, useRef } from 'react';
import Image from 'next/image';
import { twMerge } from 'tailwind-merge';
import type { ProductCardProps } from '@/types/product-catalog';
import ColorSwatch from './ColorSwatch';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { generateId, AriaHelpers, ScreenReaderAnnouncer } from '@/utils/accessibility';
import LoginModal from '../ui/LoginModal';
import { useRef } from 'react';
import { useVisibleInventoryRecalc } from '@/hooks/useVisibleInventoryRecalc';

const ProductCard = memo(({
  product,
  onAddToCart,
  onAddToWishlist,
  onColorChange,
  className
}: ProductCardProps & { className?: string }) => {
  const [selectedColor, setSelectedColor] = useState(product.colors[0]?.name || '');
  const [imageError, setImageError] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  const { cart, addToCart, isInCart } = useCart();
  const { auth } = useAuth();
  const { wishlist, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist(auth.isAuthenticated);
  const { addNotification } = useNotifications();

  // Accessibility refs and IDs
  const cardRef = useRef<HTMLDivElement>(null);
  const announcer = ScreenReaderAnnouncer.getInstance();
  const [elementIds] = useState({
    card: generateId('product-card'),
    image: generateId('product-image'),
    title: generateId('product-title'),
    price: generateId('product-price'),
    rating: generateId('product-rating'),
    colors: generateId('product-colors'),
    actions: generateId('product-actions')
  });

  // Memoize the current image calculation to avoid recalculation on every render
  const currentImage = useMemo(() => {
    if (selectedColor) {
      const colorImage = product.images.find(img => img.colorName === selectedColor);
      if (colorImage) return colorImage;
    }
    return product.images[0] || { url: '', alt: product.name };
  }, [selectedColor, product.images, product.name]);

  const handleColorChange = useCallback((colorName: string) => {
    setSelectedColor(colorName);
    onColorChange(product.id, colorName);
    
    // Announce color change to screen readers
    announcer.announce(`Selected ${colorName} color for ${product.name}`, 'polite');
  }, [product.id, product.name, onColorChange, announcer]);

  const handleAddToCart = async () => {
    try {
      await addToCart(product.id, { 
        color: selectedColor,
        quantity: 1 
      });
      
      addNotification({
        type: 'success',
        title: 'Added to Cart',
        message: `${product.name} has been added to your cart.`,
        duration: 3000,
      });
      
      // Also call the parent callback if provided
      onAddToCart?.(product.id);
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to Add to Cart',
        message: error instanceof Error ? error.message : 'Something went wrong.',
        duration: 4000,
      });
    }
  };

  const handleAddToWishlist = async () => {
    if (!auth.isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    try {
      const isCurrentlyInWishlist = isInWishlist(product.id);
      
      if (isCurrentlyInWishlist) {
        await removeFromWishlist(product.id);
        addNotification({
          type: 'info',
          title: 'Removed from Wishlist',
          message: `${product.name} has been removed from your wishlist.`,
          duration: 3000,
        });
      } else {
        await addToWishlist(product.id);
        addNotification({
          type: 'success',
          title: 'Added to Wishlist',
          message: `${product.name} has been added to your wishlist.`,
          duration: 3000,
        });
      }
      
      // Also call the parent callback if provided
      onAddToWishlist?.(product.id);
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Wishlist Error',
        message: error instanceof Error ? error.message : 'Something went wrong.',
        duration: 4000,
      });
    }
  };

  const handleLoginSuccess = async () => {
    // After successful login, try adding to wishlist again
    try {
      await addToWishlist(product.id);
      addNotification({
        type: 'success',
        title: 'Added to Wishlist',
        message: `${product.name} has been added to your wishlist.`,
        duration: 3000,
      });
      onAddToWishlist?.(product.id);
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Wishlist Error',
        message: error instanceof Error ? error.message : 'Something went wrong.',
        duration: 4000,
      });
    }
  };

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  // Trigger lightweight auto-recalc when card becomes visible or hovered
  useVisibleInventoryRecalc(cardRef, product.id);

  return (
    <article 
      ref={cardRef}
      className={twMerge(
        'group relative bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 mobile-optimized',
        'focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2',
        className
      )}
      id={elementIds.card}
      aria-labelledby={elementIds.title}
      aria-describedby={`${elementIds.price} ${elementIds.rating}`}
    >
      {/* Product Image */}
      <div 
        className="relative aspect-square bg-gray-100"
        id={elementIds.image}
      >
        {!imageError && currentImage.url ? (
          <Image
            src={currentImage.url}
            alt={`${product.name} in ${selectedColor || 'default color'}`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
            onError={handleImageError}
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+Rj9v/2Q=="
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center bg-gray-200"
            role="img"
            aria-label={`No image available for ${product.name}`}
          >
            <div className="text-gray-400 text-center">
              <svg 
                className="w-12 h-12 mx-auto mb-2" 
                fill="currentColor" 
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">No Image</span>
            </div>
          </div>
        )}
        
        {/* Sale Badge */}
        {product.isOnSale && (
          <div 
            className="absolute top-2 left-2 bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded"
            role="img"
            aria-label="On sale"
          >
            SALE
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Stock badge */}
        {(() => {
          const stock = (product as any).available_units ?? (product as any).units ?? (product as any).stock;
          const n = typeof stock === 'string' ? parseFloat(stock) : (stock || 0);
          return (
            <div className="mb-2">
              {n <= 0 ? (
                <span className="px-2 py-0.5 text-xs rounded bg-red-600 text-white">Out of stock</span>
              ) : n <= 5 ? (
                <span className="px-2 py-0.5 text-xs rounded bg-yellow-500 text-white">Low stock</span>
              ) : (
                <span className="px-2 py-0.5 text-xs rounded bg-emerald-600 text-white">In stock</span>
              )}
            </div>
          );
        })()}
        {/* Brand */}
        <div className="text-sm text-gray-600 mb-1">
          {product.brand}
        </div>

        {/* Product Name */}
        <h3 
          className="font-medium text-gray-900 mb-2 line-clamp-2"
          id={elementIds.title}
        >
          {product.name}
        </h3>

        {/* Rating */}
        <div 
          className="flex items-center mb-2"
          id={elementIds.rating}
          role="img"
          aria-label={`Rated ${product.rating} out of 5 stars based on ${product.reviewCount} reviews`}
        >
          <div className="flex items-center" aria-hidden="true">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={twMerge(
                  'w-4 h-4',
                  i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'
                )}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-sm text-gray-600 ml-1" aria-hidden="true">
            ({product.reviewCount})
          </span>
        </div>

        {/* Price */}
        <div 
          className="flex items-center mb-3"
          id={elementIds.price}
        >
          {product.isOnSale && product.salePrice ? (
            <>
              <span 
                className="text-lg font-semibold text-red-600"
                aria-label={`Sale price $${product.salePrice.toFixed(2)}`}
              >
                ${product.salePrice.toFixed(2)}
              </span>
              <span 
                className="text-sm text-gray-500 line-through ml-2"
                aria-label={`Original price $${product.price.toFixed(2)}`}
              >
                ${product.price.toFixed(2)}
              </span>
            </>
          ) : (
            <span 
              className="text-lg font-semibold text-gray-900"
              aria-label={`Price $${product.price.toFixed(2)}`}
            >
              ${product.price.toFixed(2)}
            </span>
          )}
        </div>

        {/* Color Swatches */}
        {product.colors.length > 0 && (
          <div 
            className="flex items-center gap-2 mb-3"
            id={elementIds.colors}
          >
            <span className="text-sm text-gray-600" id={`${elementIds.colors}-label`}>
              Colors:
            </span>
            <ColorSwatch
              colors={product.colors}
              selectedColor={selectedColor}
              onColorSelect={handleColorChange}
              maxVisible={8}
              ariaLabelledBy={`${elementIds.colors}-label`}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div 
          className="flex gap-2 sm:gap-3"
          id={elementIds.actions}
          role="group"
          aria-label="Product actions"
        >
          <button
            onClick={handleAddToCart}
            disabled={cart.isLoading}
            className={twMerge(
              'flex-1 bg-gray-900 text-white text-sm font-medium py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg hover:bg-gray-800 transition-all duration-200 flex items-center justify-center',
              'focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2',
              'active:scale-95 min-h-[44px]',
              cart.isLoading && 'opacity-50 cursor-not-allowed',
              isInCart(product.id) && 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
            )}
            aria-label={
              cart.isLoading 
                ? 'Adding to cart...' 
                : isInCart(product.id) 
                  ? `${product.name} is in cart` 
                  : `Add ${product.name} to cart`
            }
            {...AriaHelpers.loading(cart.isLoading)}
          >
            {cart.isLoading ? (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : isInCart(product.id) ? (
              <>
                <svg className="w-4 h-4 mr-1 sm:mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="hidden xs:inline">In Cart</span>
                <span className="xs:hidden">✓</span>
              </>
            ) : (
              <>
                <span className="hidden xs:inline">Add to Cart</span>
                <span className="xs:hidden">Add</span>
              </>
            )}
          </button>
          <button
            onClick={handleAddToWishlist}
            disabled={wishlist.isLoading}
            className={twMerge(
              'p-2.5 sm:p-3 border border-gray-300 rounded-lg hover:border-gray-400 transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2',
              'active:scale-95 min-h-[44px] min-w-[44px]',
              wishlist.isLoading && 'opacity-50 cursor-not-allowed',
              isInWishlist(product.id) && 'border-red-300 bg-red-50 hover:border-red-400 focus:ring-red-500'
            )}
            aria-label={
              wishlist.isLoading
                ? 'Updating wishlist...'
                : isInWishlist(product.id) 
                  ? `Remove ${product.name} from wishlist` 
                  : `Add ${product.name} to wishlist`
            }
            {...AriaHelpers.loading(wishlist.isLoading)}
          >
            {wishlist.isLoading ? (
              <svg className="animate-spin w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg 
                className={twMerge(
                  'w-5 h-5',
                  isInWishlist(product.id) ? 'text-red-600' : 'text-gray-600'
                )} 
                fill={isInWishlist(product.id) ? 'currentColor' : 'none'} 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
        title="Sign in to save favorites"
        message="Create an account or sign in to add items to your wishlist and save them for later."
      />
    </article>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;