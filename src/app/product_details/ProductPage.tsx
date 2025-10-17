'use client';
import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Client, Databases, Storage } from 'appwrite';
import ProductImageGallery from '@/components/ui/ProductImageGallery';
import ProductVariations, { VariationGroup, VariationOption } from '@/components/ui/ProductVariations';
import ProductErrorBoundary from '@/components/ui/ProductErrorBoundary';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Dropdown from '../../../components/ui/Dropdown';
import { useProductDetails } from '@/hooks/useProductDetails';
import { PageLoadingSpinner, ProgressiveLoader } from '@/components/ui/LoadingStates';

interface Product {
  id: string;
  name: string;
  style: string;
  price: {
    sale: string;
    original: string;
  };
  rating: number;
  reviewCount: number;
  colors: string[];
  sizes: string[];
  images: { [key: string]: string };
}

interface RelatedProduct {
  id: string;
  name: string;
  price: string;
  image: string;
}

export default function ProductPage() {
  const params = useParams();
  const productSlug = params?.slug as string || 'default-product';

  // Initialize Appwrite client
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '');

  const databases = new Databases(client);
  const storage = new Storage(client);

  // Use the custom hook for product details
  const {
    product,
    loading,
    error,
    selectedVariations,
    selectedColor,
    selectedSize,
    quantity,
    currentImageIndex,
    processedImages,
    setSelectedColor,
    setSelectedSize,
    setQuantity,
    setCurrentImageIndex,
    setSelectedVariations,
    handleVariationChange,
    refetch
  } = useProductDetails(productSlug, databases, storage);

  // Debug logging
  console.log('🔍 ProductPage Debug:', {
    productSlug,
    hasProduct: !!product,
    loading,
    error,
    productName: product?.name,
    imagesCount: product?.images?.length || 0,
    variationsCount: product?.variations?.length || 0,
    processedImagesCount: processedImages?.length || 0,
    selectedColor,
    selectedSize,
    isUsingStaticData: !product
  });

  const [addEmbroidery, setAddEmbroidery] = useState(false);
  const [featuresExpanded, setFeaturesExpanded] = useState(true);

  // Force refetch on component mount to ensure fresh data
  useEffect(() => {
    if (product && !loading) {
      console.log('🔄 Forcing refetch to ensure fresh data...');
      refetch();
    }
  }, []); // Only run on mount

  // Show loading state while fetching data
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="w-full max-w-[1448px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PageLoadingSpinner message="Loading product details..." />
        </div>
      </div>
    );
  }

  // Fallback to static data if Appwrite fails or returns no data
  const staticProduct: Product = {
    id: 'BSS577',
    name: 'Butter-Soft STRETCH Men\'s 4-Pocket V-Neck Scrub Top',
    style: 'BSS577',
    price: {
      sale: '$11.91 - $25.64',
      original: '$26.99'
    },
    rating: 4.5,
    reviewCount: 408,
    colors: ['Royal', 'Navy', 'Black', 'White', 'Gray', 'Teal', 'Purple', 'Green'],
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2X', '3X', '4X', '5X'],
    images: {
      'Royal': '/figma/product-images/main-product-royal.png',
      'Navy': '/figma/product-images/main-product-navy.png',
      'Black': '/figma/product-images/main-product-black.png',
      'White': '/figma/product-images/main-product-white.png',
      'Gray': '/figma/product-images/main-product-gray.png',
      'Teal': '/figma/product-images/main-product-teal.png',
      'Purple': '/figma/product-images/main-product-purple.png',
      'Green': '/figma/product-images/main-product-green.png'
    }
  };

  // Use dynamic data if available, otherwise fall back to static data
  const displayProduct = product || staticProduct;
  const isUsingStaticData = !product;

  // Transform data for UI components with proper main/back view separation
  const productImages = useMemo(() => {
    if (isUsingStaticData) {
      // For static data, create main and back views for each color
      const images: any[] = [];
      (displayProduct as Product).colors.forEach((color, index) => {
        // Main view
        images.push({
          src: (displayProduct as Product).images[color],
          alt: `${displayProduct.name} - ${color} - Main View`,
          color,
          isMain: true,
          imageType: 'main'
        });
        // Back view (reuse same image for static demo)
        images.push({
          src: (displayProduct as Product).images[color],
          alt: `${displayProduct.name} - ${color} - Back View`,
          color,
          isMain: false,
          imageType: 'back'
        });
      });
      return images;
    } else {
      // For dynamic data, organize images by color and type
      return (processedImages || []).map((processedImg: any) => {
        const imageData = processedImg.original || processedImg;
        console.log('🖼️ Processing image for gallery:', {
          src: imageData.url,
          alt: imageData.alt_text,
          type: imageData.image_type,
          variation: imageData.variation_id
        });

        return {
          src: imageData.url,
          alt: imageData.alt_text || `${displayProduct.name} - Image`,
          color: imageData.variation_id || imageData.variation_value || 'Default',
          isMain: imageData.image_type === 'main',
          imageType: imageData.image_type
        };
      });
    }
  }, [isUsingStaticData, displayProduct, processedImages]);

  // Log the actual URLs being passed to the gallery
  console.log('🎨 ProductImageGallery URLs:', productImages.map(img => ({
    src: img.src,
    color: img.color,
    type: img.imageType,
    alt: img.alt
  })));

  const variationGroups: VariationGroup[] = [];

  if (isUsingStaticData) {
    // Use static variation data
    const staticProduct = displayProduct as Product;
    variationGroups.push(
      {
        id: 'color',
        name: 'Color',
        type: 'color',
        required: true,
        options: staticProduct.colors.map(color => ({
          id: color,
          value: color,
          label: color,
          available: true,
          stockCount: Math.floor(Math.random() * 50) + 10,
          image: staticProduct.images[color]
        }))
      },
      {
        id: 'size',
        name: 'Size',
        type: 'size',
        required: true,
        options: staticProduct.sizes.map(size => ({
          id: size,
          value: size,
          label: size,
          available: true,
          stockCount: Math.floor(Math.random() * 30) + 5
        }))
      }
    );
  } else {
    // Use dynamic variation data
    const dynamicProduct = displayProduct as any;
    const variations = dynamicProduct.variations || [];

    // Debug logging to see what variations data we have
    console.log('Dynamic product variations:', variations);

    const colorVariations = variations.filter((v: any) => v.variation_type === 'color');
    const sizeVariations = variations.filter((v: any) => v.variation_type === 'size');
    const otherVariations = variations.filter((v: any) => v.variation_type !== 'color' && v.variation_type !== 'size');

    if (colorVariations.length > 0) {
      variationGroups.push({
        id: 'color',
        name: 'Color',
        type: 'color',
        required: true,
        options: colorVariations.map((variation: any) => {
          const image = dynamicProduct.images?.find((img: any) => img.variation_id === variation.id);
          return {
            id: variation.id,
            value: variation.variation_value,
            label: variation.variation_label || variation.variation_value,
            available: variation.stock_quantity > 0,
            stockCount: variation.stock_quantity,
            priceModifier: variation.price_modifier || 0,
            image: image?.image_url
          };
        })
      });
    }

    if (sizeVariations.length > 0) {
      variationGroups.push({
        id: 'size',
        name: 'Size',
        type: 'size',
        required: true,
        options: sizeVariations.map((variation: any) => ({
          id: variation.id,
          value: variation.variation_value,
          label: variation.variation_label || variation.variation_value,
          available: variation.stock_quantity > 0,
          stockCount: variation.stock_quantity,
          priceModifier: variation.price_modifier || 0
        }))
      });
    }

    // Add other variation types if they exist
    otherVariations.forEach((variation: any) => {
      variationGroups.push({
        id: variation.variation_type,
        name: variation.variation_type.charAt(0).toUpperCase() + variation.variation_type.slice(1),
        type: variation.variation_type as 'color' | 'size' | 'style' | 'material',
        required: false,
        options: [{
          id: variation.id,
          value: variation.variation_value,
          label: variation.variation_label,
          available: variation.stock_quantity > 0,
          stockCount: variation.stock_quantity,
          priceModifier: variation.price_modifier
        }]
      });
    });
  }

  const relatedProducts: RelatedProduct[] = [
    {
      id: '1',
      name: 'Butter-Soft STRETCH Men\'s 9-Pocket Zip Front Cargo Straight Leg Scrub Pants',
      price: 'EGP 1,300.00 - EGP 1,700.00',
      image: '/images/img_butter_soft_stretch_322x216.png'
    },
    {
      id: '2',
      name: 'Butter-Soft STRETCH Men\'s 7-Pocket Cargo Jogger Scrub Pants',
      price: 'EGP 1,900.00',
      image: '/images/img_butter_soft_stretch_3.png'
    }
  ]

  const suggestedProducts: RelatedProduct[] = [
    {
      id: '1',
      name: 'Butter-Soft STRETCH Men\'s 6-Pocket V-Neck Scrub Top',
      price: 'EGP 1,100.00 - EGP 1,450.00',
      image: '/images/img_butter_soft_stretch_4.png'
    },
    {
      id: '2',
      name: 'Butter-Soft STRETCH Men\'s 9-Pocket Zip Front Cargo Straight Leg Scrub Pants',
      price: 'EGP 1,300.00 - EGP 1,700.00',
      image: '/images/img_butter_soft_stretch_5.png'
    },
    {
      id: '3',
      name: 'Butter-Soft STRETCH Men\'s 7-Pocket Cargo Jogger Scrub Pants',
      price: 'EGP 1,900.00',
      image: '/images/img_butter_soft_stretch_6.png'
    },
    {
      id: '4',
      name: 'Dev Egypt STRETCH Men\'s 4-Pocket V-Neck Scrub Top',
      price: 'EGP 1,100.00 - EGP 1,400.00',
      image: '/images/img_advantage_stretch.png'
    },
    {
      id: '5',
      name: 'Dev Egypt STRETCH Men\'s 5-Pocket V-Neck Air Scrub Top',
      price: 'EGP 965.00',
      image: '/images/img_advantage_stretch_322x216.png'
    }
  ]

  const handleQuantityChange = (change: number) => {
    const newQuantity = Math.max(1, quantity + change);
    setQuantity(newQuantity);
  };

  // Calculate if all required variations are selected
  const requiredVariations = variationGroups.filter(group => group.required);
  const hasAllRequiredVariations = requiredVariations.every(group =>
    selectedVariations[group.id] && selectedVariations[group.id] !== ''
  );

  // Calculate total price
  const calculateTotalPrice = () => {
    let totalPrice = isUsingStaticData
      ? parseFloat((displayProduct as Product).price.sale.replace('$', '').split(' - ')[0])
      : (displayProduct as any).discount_price > 0 ? (displayProduct as any).discount_price : (displayProduct as any).price;

    // Add price modifiers from selected variations
    Object.entries(selectedVariations).forEach(([groupId, optionId]) => {
      if (isUsingStaticData) {
        // For static data, add a small modifier based on variation
        if (groupId === 'size' && ['2X', '3X', '4X', '5X'].includes(optionId)) {
          totalPrice += 50; // Size upcharge for static data
        }
      } else {
        const variation = (displayProduct as any).variations.find((v: any) => v.id === optionId);
        if (variation) {
          totalPrice += variation.price_modifier || 0;
        }
      }
    });

    // Add embroidery cost if selected
    if (addEmbroidery && (isUsingStaticData || (displayProduct as any).embroidery_available)) {
      const embroideryPrice = isUsingStaticData ? 7.99 : (displayProduct as any).embroidery_price;
      totalPrice += embroideryPrice;
    }

    return totalPrice * quantity;
  };

  const handleAddToBag = () => {
    // Calculate total price including variations and embroidery
    let totalPrice = isUsingStaticData
      ? parseFloat((displayProduct as Product).price.sale.replace('$', '').split(' - ')[0])
      : (displayProduct as any).discount_price > 0 ? (displayProduct as any).discount_price : (displayProduct as any).price;

    // Add price modifiers from selected variations
    Object.entries(selectedVariations).forEach(([groupId, optionId]) => {
      if (isUsingStaticData) {
        // For static data, add a small modifier based on variation
        if (groupId === 'size' && ['2X', '3X', '4X', '5X'].includes(optionId)) {
          totalPrice += 50; // Size upcharge for static data
        }
      } else {
        const variation = (displayProduct as any).variations.find((v: any) => v.id === optionId);
        if (variation) {
          totalPrice += variation.price_modifier || 0;
        }
      }
    });

    // Add embroidery cost if selected
    if (addEmbroidery && (isUsingStaticData || (displayProduct as any).embroidery_available)) {
      const embroideryPrice = isUsingStaticData ? 7.99 : (displayProduct as any).embroidery_price;
      totalPrice += embroideryPrice;
    }

    // Add to cart logic
    console.log('Added to bag:', {
      productId: displayProduct.id,
      productName: displayProduct.name,
      selectedVariations,
      quantity,
      addEmbroidery,
      unitPrice: isUsingStaticData
        ? parseFloat((displayProduct as Product).price.sale.replace('$', '').split(' - ')[0])
        : (displayProduct as any).discount_price > 0 ? (displayProduct as any).discount_price : (displayProduct as any).price,
      totalPrice: totalPrice * quantity,
      embroideryCost: addEmbroidery && (isUsingStaticData || (displayProduct as any).embroidery_available)
        ? (isUsingStaticData ? 7.99 : (displayProduct as any).embroidery_price)
        : 0
    });

    // Here you would typically dispatch to a cart context or make an API call
    // For now, we'll just show a success message or handle via toast notification
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
  };

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
  };


  return (
    <ProductErrorBoundary>
      <div className="min-h-screen bg-white">

        <main className="w-full">
        {/* Breadcrumb */}
        <div className="w-full max-w-[1448px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center text-sm text-neutral-dark">
            <span>Home</span>
            <span className="mx-2">/</span>
            <span>Discount Scrubs</span>
            <span className="mx-2">/</span>
            <span>Collections</span>
            <span className="mx-2">/</span>
            <span>Last Chance</span>
          </nav>
        </div>

        {/* Product Section */}
        <div className="w-full max-w-[1448px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
            {/* Enhanced Product Images */}
            <ProgressiveLoader
              isLoading={loading}
              loadingComponent={<div className="bg-neutral-light rounded-lg overflow-hidden"><div className="aspect-[3/4] bg-gray-200 animate-pulse" /></div>}
            >
              <ProductImageGallery
                images={productImages}
                selectedColor={selectedColor}
                onColorChange={setSelectedColor}
                className="w-full"
                priority={true}
                showThumbnails={true}
                maxThumbnails={4}
              />
            </ProgressiveLoader>

            {/* Product Details */}
            <div className="space-y-6">
              {/* Product Title and Rating */}
              <div className="space-y-2">
                <p className="text-sm font-normal text-black uppercase underline">
                  Product Details
                </p>
                <h1 className="text-xl lg:text-2xl font-medium text-black leading-tight">
                  {displayProduct.name}
                </h1>
                <p className="text-sm font-normal text-text-muted uppercase">
                  SKU: {isUsingStaticData ? (displayProduct as Product).style : (displayProduct as any).sku}
                </p>

                {/* Rating - Using placeholder for now since not in ProductDetails */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Image
                        key={i}
                        src="/images/img_component_7.svg"
                        alt="Star"
                        width={12}
                        height={14}
                        className="w-3 h-3"
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-neutral-dark">(Customer Reviews)</span>
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-2">
                <div className="flex items-end gap-2">
                  <span className="text-2xl lg:text-3xl font-medium text-primary">
                    {isUsingStaticData ? (
                      <>EGP {(displayProduct as Product).price.sale}</>
                    ) : (
                      <>EGP {(displayProduct as any).discount_price > 0 ? (displayProduct as any).discount_price : (displayProduct as any).price}</>
                    )}
                  </span>
                  {isUsingStaticData ? (
                    <span className="text-lg lg:text-xl font-normal text-text-light line-through">
                      EGP {(displayProduct as Product).price.original}
                    </span>
                  ) : (
                    (displayProduct as any).discount_price > 0 && (
                      <span className="text-lg lg:text-xl font-normal text-text-light line-through">
                        EGP {(displayProduct as any).price}
                      </span>
                    )
                  )}
                </div>
                <p className="text-sm font-medium text-black">
                  {isUsingStaticData ? (
                    <>2X-3X add EGP 155.00, 4X-5X add EGP 255.00</>
                  ) : (
                    <>Stock: {(displayProduct as any).stock_quantity} available</>
                  )}
                </p>
                {isUsingStaticData ? (
                  <p className="text-base font-medium text-primary">
                    Sale! Ends 9/29/25
                  </p>
                ) : (
                  (displayProduct as any).discount_price > 0 && (
                    <p className="text-base font-medium text-primary">
                      Sale! Special Price
                    </p>
                  )
                )}
              </div>

              {/* Enhanced Product Variations */}
              <ProgressiveLoader
                isLoading={loading}
                loadingComponent={<div className="space-y-4"><div className="h-20 bg-gray-200 animate-pulse rounded" /></div>}
              >
                <ProductVariations
                  variations={variationGroups}
                  selectedVariations={selectedVariations}
                  onVariationChange={handleVariationChange}
                  maxStock={isUsingStaticData ? 100 : (displayProduct as any).stock_quantity}
                  className="w-full"
                />
              </ProgressiveLoader>

              {/* Add Embroidery */}
              {(isUsingStaticData || (displayProduct as any).embroidery_available) && (
                <div className="bg-neutral-light rounded-base p-4">
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => setAddEmbroidery(!addEmbroidery)}
                      className="w-5 h-5 border border-text-light rounded-xs bg-white mt-1 flex items-center justify-center"
                      aria-label={addEmbroidery ? 'Remove embroidery' : 'Add embroidery'}
                    >
                      {addEmbroidery && (
                        <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="space-y-1">
                        <h4 className="text-base font-bold text-black">Add Embroidery</h4>
                        <p className="text-sm font-normal text-black">
                          {isUsingStaticData ? 'From $7.99' : ((displayProduct as any).embroidery_price > 0 ? `EGP ${(displayProduct as any).embroidery_price}` : 'Free with purchase')}
                        </p>
                        <p className="text-xs font-normal text-text-light">
                          {addEmbroidery ? 'Embroidery selected - configure options after adding to bag' : 'Select options once you add to bag'}
                        </p>
                        {addEmbroidery && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                            ✓ Embroidery service added (EGP {isUsingStaticData ? '7.99' : (displayProduct as any).embroidery_price})
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quantity and Add to Bag */}
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-0">
                  <button 
                    onClick={() => handleQuantityChange(-1)}
                    className="w-14 h-12 flex items-center justify-center border border-border-primary bg-white"
                  >
                    <Image src="/images/img_container.svg" alt="Decrease" width={56} height={50} className="w-6 h-6" />
                  </button>
                  <div className="w-20 h-12 flex items-center justify-center border-t border-b border-border-primary bg-white">
                    <span className="text-xl font-bold text-black">{quantity}</span>
                  </div>
                  <button 
                    onClick={() => handleQuantityChange(1)}
                    className="w-14 h-12 flex items-center justify-center border border-border-primary bg-white"
                  >
                    <Image src="/images/img_container_gray_300.svg" alt="Increase" width={56} height={50} className="w-6 h-6" />
                  </button>
                </div>

                <Button
                  variant="default"
                  disabled={!hasAllRequiredVariations}
                  className={`w-full font-normal uppercase text-base px-8 py-4 rounded-base ${
                    hasAllRequiredVariations
                      ? 'bg-primary text-white hover:bg-primary/90'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  onClick={handleAddToBag}
                >
                  {hasAllRequiredVariations ? (
                    <>
                      ADD TO BAG • EGP {calculateTotalPrice().toFixed(2)}
                    </>
                  ) : (
                    'SELECT REQUIRED OPTIONS'
                  )}
                </Button>

                {!hasAllRequiredVariations && (
                  <p className="text-sm text-red-600 mt-2 text-center">
                    Please select {requiredVariations.map(group => group.name.toLowerCase()).join(' and ')} to continue
                  </p>
                )}
              </div>

              {/* Finish Your Look */}
              {selectedColor && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-normal text-neutral-dark">Finish Your Look in </span>
                    <span className="text-base font-normal text-black underline capitalize">{selectedColor}</span>
                  </div>

                  <div className="bg-neutral-light rounded-base p-4">
                    <div className="flex flex-col items-center space-y-2">
                      {/* Show selected color image if available */}
                      {(() => {
                        if (isUsingStaticData) {
                          const staticProduct = displayProduct as Product;
                          return (
                            <div
                              className="w-11 h-11 rounded-full"
                              style={{ backgroundColor: selectedColor?.toLowerCase() || '#3B82F6' }}
                            />
                          );
                        } else {
                          const selectedColorImage = (displayProduct as any).images.find((img: any) => img.variation_id === selectedColor);
                          return selectedColorImage ? (
                            <Image
                              src={selectedColorImage.image_url}
                              alt={`${selectedColor} Color`}
                              width={44}
                              height={44}
                              className="w-11 h-11 rounded-full object-cover"
                            />
                          ) : (
                            <div
                              className="w-11 h-11 rounded-full"
                              style={{ backgroundColor: selectedColor?.toLowerCase() || '#3B82F6' }}
                            />
                          );
                        }
                      })()}
                      <span className="text-xs font-normal text-black capitalize">{selectedColor}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Product Features */}
              <div className="bg-white border-t border-border-primary">
                <button
                  onClick={() => setFeaturesExpanded(!featuresExpanded)}
                  className="w-full flex items-center justify-between py-5 bg-white"
                >
                  <span className="text-sm font-normal text-black uppercase">Features</span>
                  <Image 
                    src="/images/img_arrow_up.svg" 
                    alt="Toggle" 
                    width={10} 
                    height={6}
                    className={`transition-transform ${featuresExpanded ? 'rotate-180' : ''}`}
                  />
                </button>
                
                {featuresExpanded && (
                  <div className="pb-8 space-y-4">
                    <p className="text-base font-normal text-neutral-dark leading-relaxed">
                      Our customers are loving the softness and fit of this classic men's scrub top style. 
                      You cannot go wrong with a v-neck look and plenty of pockets. Double-needle topstitch 
                      gives it a unique touch. Each piece in our Butter-soft Stretch scrub collection was 
                      designed for 12+ hour shifts, and made from easy-care, 2-way stretch comfort fabric.
                    </p>
                    
                    <ul className="space-y-3 text-base font-normal text-neutral-dark">
                      <li className="ml-5">Classic fit</li>
                      <li className="ml-5">V-neck</li>
                      <li className="ml-5">Total of 4 pockets</li>
                      <li className="ml-5">1 chest pocket</li>
                      <li className="ml-5">2 small item pockets on chest</li>
                      <li className="ml-5">1 pocket on left sleeve</li>
                      <li className="ml-5">Short sleeve</li>
                      <li className="ml-5">Side vents</li>
                      <li className="ml-5">Approximate length for size L is 30 1/2"</li>
                    </ul>
                    
                    <div className="space-y-2 pt-4">
                      <h4 className="text-base font-bold text-neutral-dark">Color Match</h4>
                      <p className="text-sm font-normal text-neutral-dark leading-relaxed">
                        When coordinating solids, we recommend selecting from the Butter-Soft STRETCH 
                        collection to ensure a perfect color match.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Dropdowns */}
              <div className="space-y-0">
                <Dropdown
                  placeholder="Fabric"
                  className="w-full border-t border-border-primary bg-white py-5 px-3"
                  text_font_size="text-sm"
                  text_text_transform="uppercase"
                  onSelect={() => {}}
                />
                <Dropdown
                  placeholder="Fit & size"
                  className="w-full border-t border-border-primary bg-white py-5 px-3"
                  text_font_size="text-sm"
                  text_text_transform="uppercase"
                  onSelect={() => {}}
                />
                <Dropdown
                  placeholder="More"
                  className="w-full border-t border-b border-border-primary bg-white py-5 px-3"
                  text_font_size="text-sm"
                  text_text_transform="uppercase"
                  onSelect={() => {}}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Finish Your Look Tool */}
        <section className="w-full bg-white py-16 mt-20">
          <div className="w-full max-w-[1448px] mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-normal text-black text-center mb-8">
              Finish Your Look Tool
            </h2>
            
            <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
              <div className="flex flex-col items-center">
                {(() => {
                  if (isUsingStaticData) {
                    return (
                      <div
                        className="w-9.5 h-9.5 rounded-full mb-3"
                        style={{ backgroundColor: selectedColor?.toLowerCase() || '#3B82F6' }}
                      />
                    );
                  } else {
                    const selectedColorImage = (displayProduct as any).images.find((img: any) => img.variation_id === selectedColor);
                    return selectedColorImage ? (
                      <Image
                        src={selectedColorImage.image_url}
                        alt={`${selectedColor} Color`}
                        width={38}
                        height={38}
                        className="mb-3 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-9.5 h-9.5 rounded-full mb-3"
                        style={{ backgroundColor: selectedColor?.toLowerCase() || '#3B82F6' }}
                      />
                    );
                  }
                })()}
                <span className="text-xs font-bold text-black capitalize">{selectedColor || 'Color'}</span>
              </div>
              
              <div className="flex flex-col items-center">
                <span className="text-base font-normal text-black mb-8">Length</span>
              </div>
              
              <div className="flex flex-col items-center">
                <span className="text-base font-normal text-black mb-8">Size</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
              {relatedProducts.map((product) => (
                <div key={product.id} className="flex flex-col items-center">
                  <div className="bg-neutral-light rounded-lg overflow-hidden mb-4">
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={216}
                      height={322}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                  <div className="text-center space-y-3">
                    <h3 className="text-base font-normal text-black leading-tight">
                      {product.name}
                    </h3>
                    <p className="text-base font-medium text-primary-background">
                      {product.price}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* May We Suggest */}
        <section className="w-full bg-white py-16">
          <div className="w-full max-w-[1448px] mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-normal text-black text-center mb-8">
              May We Suggest
            </h2>
            
            <div className="relative">
              <div className="flex items-center gap-4">
                <button className="w-11 h-11 bg-background-overlay rounded-full flex items-center justify-center shadow-lg">
                  <Image src="/images/img_component_9.svg" alt="Previous" width={44} height={44} />
                </button>
                
                <div className="flex-1 overflow-x-auto">
                  <div className="flex gap-5 pb-4">
                    {suggestedProducts.map((product) => (
                      <div key={product.id} className="flex-shrink-0 w-[216px]">
                        <div className="bg-neutral-light rounded-lg overflow-hidden mb-4">
                          <Image
                            src={product.image}
                            alt={product.name}
                            width={216}
                            height={322}
                            className="w-full h-auto object-cover"
                          />
                        </div>
                        <div className="space-y-3 px-2">
                          <h3 className="text-base font-normal text-black leading-tight">
                            {product.name}
                          </h3>
                          <p className="text-base font-medium text-primary-background">
                            {product.price}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <button className="w-11 h-11 bg-background-overlay rounded-full flex items-center justify-center shadow-lg">
                  <Image src="/images/img_component_10.svg" alt="Next" width={44} height={44} />
                </button>
              </div>
              
              {/* Pagination Dots */}
              <div className="flex justify-center items-center gap-1 mt-8">
                {[...Array(10)].map((_, index) => (
                  <div
                    key={index}
                    className={`w-6 h-1 ${index === 0 ? 'bg-black' : 'bg-gray-300'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Recently Viewed */}
        <section className="w-full bg-white py-16">
          <div className="w-full max-w-[1448px] mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-normal text-black text-center mb-12">
              Recently Viewed
            </h2>
            
            <div className="flex justify-center">
              <div className="w-[182px]">
                <div className="bg-neutral-light rounded-lg overflow-hidden mb-4">
                  <Image
                    src="/images/img_butter_soft_stretch_270x182.png"
                    alt="Recently Viewed Product"
                    width={182}
                    height={270}
                    className="w-full h-auto object-cover"
                  />
                </div>
                <div className="space-y-3 px-2">
                  <h3 className="text-base font-normal text-black leading-tight">
                    Butter-Soft STRETCH Men's 4-Pocket V-Neck Scrub Top
                  </h3>
                  <p className="text-base font-medium text-primary-background">
                    EGP 640.00 - EGP 1,400.00
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      </div>
    </ProductErrorBoundary>
  )
}