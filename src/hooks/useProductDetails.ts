'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Databases, Storage } from 'appwrite';
import {
  ProductData,
  ProductVariation,
  ProductImage,
  createProductRepository
} from '@/lib/repositories/ProductRepository';
import {
  createProductService,
  ProductVariationSelection,
  ProductPricingInfo,
  ProductAvailabilityInfo
} from '@/lib/services/ProductService';
import { createImageService } from '@/lib/services/ImageService';
import { createProductCacheService } from '@/lib/services/CacheService';
import { createErrorService } from '@/lib/services/ErrorService';

// Re-export types for backward compatibility
export type { ProductVariation, ProductImage };
export interface ProductDetails extends ProductData {}

interface UseProductDetailsResult {
  product: ProductDetails | null;
  loading: boolean;
  error: string | null;
  selectedVariations: Record<string, string>;
  selectedColor: string;
  selectedSize: string;
  quantity: number;
  currentImageIndex: number;
  pricing: ProductPricingInfo | null;
  availability: ProductAvailabilityInfo | null;
  processedImages: any[] | null;
  setSelectedColor: (color: string) => void;
  setSelectedSize: (size: string) => void;
  setQuantity: (quantity: number) => void;
  setCurrentImageIndex: (index: number) => void;
  setSelectedVariations: (variations: Record<string, string>) => void;
  handleVariationChange: (groupId: string, optionId: string) => void;
  refetch: () => Promise<void>;
}

export const useProductDetails = (
  productId: string,
  databases: Databases,
  storage: Storage
): UseProductDetailsResult => {
  console.log('🚀 useProductDetails hook called with slug:', productId);

  // Initialize services
  const repository = useMemo(() => createProductRepository(databases, storage), [databases, storage]);
  const productService = useMemo(() => createProductService(databases, storage), [databases, storage]);
  const imageService = useMemo(() => createImageService(storage, databases), [storage, databases]);
  const cacheService = useMemo(() => createProductCacheService(), []);
  const errorService = useMemo(() => createErrorService(), []);

  // State management
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({});
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [pricing, setPricing] = useState<ProductPricingInfo | null>(null);
  const [availability, setAvailability] = useState<ProductAvailabilityInfo | null>(null);
  const [processedImages, setProcessedImages] = useState<any[] | null>(null);

  // Fetch product details with caching
  const fetchProductDetails = useCallback(async () => {
    if (!productId) {
      setError('Product ID is required');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check cache first
      const cachedProduct = cacheService.getProductDetails(productId);
      if (cachedProduct) {
        console.log('📦 Using cached product data');
        setProduct(cachedProduct);
        setLoading(false);
        return;
      }

      // Fetch from repository
      console.log('🔍 Fetching product details for slug:', productId);
      const result = await productService.getProductDetails(productId);

      if (result.error) {
        console.error('❌ ProductService error:', result.error);
        setError(result.error);
        return;
      }

      if (!result.product) {
        console.warn('⚠️ Product not found for slug:', productId);
        setError('Product not found');
        return;
      }

      console.log('✅ Product fetched successfully:', {
        id: result.product.id,
        name: result.product.name,
        imagesCount: result.product.images?.length || 0,
        variationsCount: result.product.variations?.length || 0
      });

      // Cache the result
      cacheService.setProductDetails(productId, result.product);

      setProduct(result.product);

    } catch (err) {
      const errorResult = errorService.handleError(err, { productId, operation: 'fetchProductDetails' });
      setError(errorResult.userMessage);

      console.error('❌ Error fetching product details:', err);
    } finally {
      setLoading(false);
    }
  }, [productId, productService, cacheService, errorService]);

  // Process images when product changes
  useEffect(() => {
    if (product?.images && product.images.length > 0) {
      console.log('🖼️ Product has images:', product.images.length, 'images');

      // Use images directly without ImageService processing to avoid URL override
      const directImages = product.images.map(img => ({
        original: img,
        url: img.image_url,
        thumbnailUrls: {},
        optimizedUrls: {}
      }));

      console.log('✅ Using direct image URLs:', directImages.map(img => img.url));
      setProcessedImages(directImages);
    } else {
      console.log('📷 No images to process or product not loaded yet');
      setProcessedImages([]);
    }
  }, [product?.images]);

  // Create stable callback references for service methods
  const calculatePricing = useCallback((
    product: ProductDetails,
    variationSelection: ProductVariationSelection,
    quantity: number
  ) => {
    return productService.calculatePricing(product, variationSelection, quantity);
  }, []); // Empty deps since productService methods should be pure

  const getAvailabilityInfo = useCallback((
    product: ProductDetails,
    variationSelection: ProductVariationSelection
  ) => {
    return productService.getAvailabilityInfo(product, variationSelection);
  }, []);

  // Update pricing and availability when product or variations change
  useEffect(() => {
    if (product) {
      const variationSelection: ProductVariationSelection = {};
      if (selectedColor) variationSelection.color = selectedColor;
      if (selectedSize) variationSelection.size = selectedSize;

      const newPricing = calculatePricing(product, variationSelection, quantity);
      const newAvailability = getAvailabilityInfo(product, variationSelection);

      setPricing(newPricing);
      setAvailability(newAvailability);
    }
  }, [product, selectedColor, selectedSize, quantity, calculatePricing, getAvailabilityInfo]);

  // Initialize default selections when product loads
  useEffect(() => {
    if (product && !selectedColor && !selectedSize) {
      const colorVariations = product.variations.filter(v => v.variation_type === 'color' && v.is_active);
      const sizeVariations = product.variations.filter(v => v.variation_type === 'size' && v.is_active);

      if (colorVariations.length > 0) {
        const defaultColor = colorVariations.find(v => v.stock_quantity > 0)?.variation_value || colorVariations[0].variation_value;
        setSelectedColor(defaultColor);
        setSelectedVariations(prev => ({ ...prev, color: defaultColor }));
      }

      if (sizeVariations.length > 0) {
        const defaultSize = sizeVariations.find(v => v.stock_quantity > 0)?.variation_value || sizeVariations[0].variation_value;
        setSelectedSize(defaultSize);
        setSelectedVariations(prev => ({ ...prev, size: defaultSize }));
      }
    }
  }, [product, selectedColor, selectedSize]);

  // Handle variation changes
  const handleVariationChange = useCallback((groupId: string, optionId: string) => {
    setSelectedVariations(prev => ({ ...prev, [groupId]: optionId }));

    // Update individual state variables for backward compatibility
    if (product?.variations) {
      const variation = product.variations.find(v => v.variation_value === optionId);
      if (variation) {
        if (variation.variation_type === 'color') {
          setSelectedColor(variation.variation_value);
        } else if (variation.variation_type === 'size') {
          setSelectedSize(variation.variation_value);
        }
      }
    }
  }, [product?.variations]);

  // Refetch function
  const refetch = useCallback(() => {
    // Invalidate cache for this product
    console.log('🔄 Invalidating cache for product:', productId);
    cacheService.invalidateProduct(productId);
    return fetchProductDetails();
  }, [fetchProductDetails, cacheService, productId]);

  // Initial fetch
  useEffect(() => {
    if (productId) {
      fetchProductDetails();
    }
  }, [productId, fetchProductDetails]);

  return {
    product,
    loading,
    error,
    selectedVariations,
    selectedColor,
    selectedSize,
    quantity,
    currentImageIndex,
    pricing,
    availability,
    processedImages,
    setSelectedColor,
    setSelectedSize,
    setQuantity,
    setCurrentImageIndex,
    setSelectedVariations,
    handleVariationChange,
    refetch
  };
};

export default useProductDetails;