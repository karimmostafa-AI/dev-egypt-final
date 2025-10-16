'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Image from 'next/image';
import LazyImage from './LazyImage';
import { ImageSkeleton } from './LoadingStates';
import { Button } from './button';

interface ProductImage {
  src: string;
  alt: string;
  color?: string;
  isMain?: boolean;
}

interface EnhancedProductImage {
  id: string;
  url: string;
  alt_text: string;
  image_type: 'main' | 'variation' | 'gallery' | 'back';
  variation_value?: string;
  sort_order: number;
}

interface OrganizedImages {
  main: EnhancedProductImage[];
  back: EnhancedProductImage[];
  gallery: EnhancedProductImage[];
  variations: Record<string, EnhancedProductImage[]>;
}

interface ProductImageGalleryProps {
  // Legacy support
  images?: ProductImage[];
  selectedColor?: string;
  onColorChange?: (color: string) => void;

  // Enhanced support
  organizedImages?: OrganizedImages;
  selectedVariations?: Record<string, string>;
  onVariationChange?: (type: string, value: string) => void;

  className?: string;
  priority?: boolean;
  showThumbnails?: boolean;
  maxThumbnails?: number;
  enableZoom?: boolean;
  enableFullscreen?: boolean;
}

interface ImageState {
  isLoading: boolean;
  hasError: boolean;
  currentIndex: number;
}

export const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  images,
  selectedColor,
  onColorChange,
  organizedImages,
  selectedVariations,
  onVariationChange,
  className = '',
  priority = false,
  showThumbnails = true,
  maxThumbnails = 4,
  enableZoom = false,
  enableFullscreen = false
}) => {
  const [imageState, setImageState] = useState<ImageState>({
    isLoading: true,
    hasError: false,
    currentIndex: 0
  });

  // Handle both legacy and enhanced data structures
  const displayImages = useMemo(() => {
    if (organizedImages) {
      // Use enhanced organized images
      const currentColor = selectedVariations?.color || selectedColor;
      if (currentColor && organizedImages.variations[currentColor]) {
        // Show variation-specific images for selected color
        return [
          ...organizedImages.main,
          ...organizedImages.back,
          ...organizedImages.variations[currentColor]
        ].sort((a, b) => a.sort_order - b.sort_order);
      } else {
        // Show main and gallery images
        return [
          ...organizedImages.main,
          ...organizedImages.back,
          ...organizedImages.gallery
        ].sort((a, b) => a.sort_order - b.sort_order);
      }
    } else if (images) {
      // Use legacy format
      return selectedColor
        ? images.filter(img => img.color === selectedColor || img.isMain)
        : images;
    }
    return [];
  }, [organizedImages, images, selectedColor, selectedVariations]);

  const currentImage = displayImages[imageState.currentIndex] || displayImages[0];

  // Helper function to get image properties regardless of format
  const getImageProps = (image: any) => {
    if (organizedImages) {
      // Enhanced format
      return {
        src: image.url,
        alt: image.alt_text,
        color: image.variation_value || image.variation_id
      };
    } else {
      // Legacy format
      return {
        src: image.src,
        alt: image.alt,
        color: image.color
      };
    }
  };

  // Preload next/previous images for smooth transitions
  useEffect(() => {
    if (displayImages.length > 1) {
      const preloadImages = [
        displayImages[imageState.currentIndex + 1],
        displayImages[imageState.currentIndex - 1]
      ].filter(Boolean);

      preloadImages.forEach(image => {
        if (image) {
          const img = new window.Image();
          const { src } = getImageProps(image);
          img.src = src;
        }
      });
    }
  }, [imageState.currentIndex, displayImages, organizedImages]);

  const handleImageLoad = useCallback(() => {
    setImageState(prev => ({ ...prev, isLoading: false }));
  }, []);

  const handleImageError = useCallback(() => {
    setImageState(prev => ({ ...prev, hasError: true, isLoading: false }));
  }, []);

  const handleThumbnailClick = useCallback((index: number) => {
    setImageState(prev => ({
      ...prev,
      currentIndex: index,
      isLoading: true,
      hasError: false
    }));
  }, []);

  const handlePrevious = useCallback(() => {
    setImageState(prev => ({
      ...prev,
      currentIndex: prev.currentIndex > 0 ? prev.currentIndex - 1 : displayImages.length - 1,
      isLoading: true
    }));
  }, [displayImages.length]);

  const handleNext = useCallback(() => {
    setImageState(prev => ({
      ...prev,
      currentIndex: prev.currentIndex < displayImages.length - 1 ? prev.currentIndex + 1 : 0,
      isLoading: true
    }));
  }, [displayImages.length]);

  // Generate color thumbnails for color selection
  const colorThumbnails = useMemo(() => {
    if (organizedImages) {
      // Use enhanced format - get unique colors from variations
      const colors = Object.keys(organizedImages.variations).slice(0, maxThumbnails);
      return colors.map(color => {
        const variationImages = organizedImages.variations[color];
        const firstImage = variationImages[0];
        return {
          src: firstImage?.url || '',
          alt: `${color} color option`,
          color,
          isMain: firstImage?.image_type === 'main'
        };
      });
    } else if (images) {
      // Use legacy format
      return images
        .filter((img, index, arr) => img.color && arr.findIndex(i => i.color === img.color) === index)
        .slice(0, maxThumbnails);
    }
    return [];
  }, [organizedImages, images, maxThumbnails]);

  if (!currentImage) {
    return (
      <div className={`bg-neutral-light rounded-lg overflow-hidden ${className}`}>
        <ImageSkeleton className="w-full aspect-[3/4]" />
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Image Display */}
      <div className="relative bg-neutral-light rounded-lg overflow-hidden group">
        <div className="aspect-[3/4] relative">
          {imageState.isLoading && (
            <ImageSkeleton className="absolute inset-0 w-full h-full" />
          )}

          {imageState.hasError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-gray-500">Image not available</p>
              </div>
            </div>
          ) : (
            <LazyImage
              src={getImageProps(currentImage).src}
              alt={getImageProps(currentImage).alt}
              width={454}
              height={678}
              priority={priority}
              className="w-full h-full object-cover"
              onLoad={handleImageLoad}
              onError={handleImageError}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 454px"
            />
          )}

          {/* Navigation Arrows */}
          {displayImages.length > 1 && !imageState.hasError && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Previous image"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Next image"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Image Counter */}
          {displayImages.length > 1 && (
            <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
              {imageState.currentIndex + 1} / {displayImages.length}
            </div>
          )}
        </div>
      </div>

      {/* Color Selection Thumbnails */}
      {showThumbnails && colorThumbnails.length > 0 && onColorChange && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Available Colors:</p>
          <div className="grid grid-cols-4 gap-2">
            {colorThumbnails.map((image, index) => (
              <button
                key={`${image.color}-${index}`}
                onClick={() => image.color && onColorChange(image.color)}
                className={`relative bg-neutral-light rounded-lg overflow-hidden hover:opacity-80 transition-opacity border-2 ${
                  selectedColor === image.color
                    ? 'border-primary ring-2 ring-primary ring-opacity-50'
                    : 'border-transparent'
                }`}
                aria-label={`Select ${image.color} color`}
                aria-pressed={selectedColor === image.color}
              >
                <div className="aspect-square">
                  <LazyImage
                    src={image.src}
                    alt={`${image.color} color option`}
                    width={100}
                    height={100}
                    className="w-full h-full object-cover"
                    priority={priority && index < 4}
                    sizes="100px"
                  />
                </div>
                {image.color && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
                    {image.color}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Image Navigation Dots */}
      {displayImages.length > 1 && (
        <div className="flex justify-center space-x-2">
          {displayImages.map((_, index) => (
            <button
              key={index}
              onClick={() => handleThumbnailClick(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === imageState.currentIndex ? 'bg-primary' : 'bg-gray-300'
              }`}
              aria-label={`View image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImageGallery;