'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MainLayout from '../../../components/MainLayout';
import { useCart } from '../../../context/CartContext';
import { Product } from '../../../types/product';
import { ShoppingCart, Heart, Share2, Star, Check, Truck, Shield, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import CurrencyConverter from '../../../components/CurrencyConverter';

interface Brand {
  $id: string;
  name: string;
  prefix: string;
  status: boolean;
}

interface Category {
  $id: string;
  name: string;
  status: boolean;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { addToCart, isInCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [addedToCart, setAddedToCart] = useState(false);

  // Fetch product by slug
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        
        // Fetch all products and find by slug
        const response = await fetch('/api/admin/products?available=true&limit=100');
        const data = await response.json();
        
        if (data.error) {
          console.error('Error fetching products:', data.error);
          return;
        }

        const foundProduct = data.products?.find((p: Product) => p.slug === slug);
        
        if (!foundProduct) {
          router.push('/404');
          return;
        }

        setProduct(foundProduct);

        // Fetch brand details
        if (foundProduct.brand_id) {
          const brandResponse = await fetch(`/api/admin/brands?status=true`);
          const brandData = await brandResponse.json();
          const productBrand = brandData.brands?.find((b: Brand) => b.$id === foundProduct.brand_id);
          setBrand(productBrand || null);
        }

        // Fetch category details
        if (foundProduct.category_id) {
          const categoryResponse = await fetch(`/api/admin/categories?status=true`);
          const categoryData = await categoryResponse.json();
          const productCategory = categoryData.categories?.find((c: Category) => c.$id === foundProduct.category_id);
          setCategory(productCategory || null);
        }

      } catch (error) {
        console.error('Failed to fetch product:', error);
        router.push('/404');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchProduct();
    }
  }, [slug, router]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity, selectedSize, selectedColor);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 3000);
    }
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

  const currentPrice = product && product.discount_price > 0 ? product.discount_price : product?.price || 0;
  const savings = product && product.discount_price > 0 ? product.price - product.discount_price : 0;
  const savingsPercent = savings > 0 && product ? Math.round((savings / product.price) * 100) : 0;

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-[1920px] mx-auto px-[50px]">
            <div className="animate-pulse">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="h-96 bg-gray-200 rounded-lg"></div>
                <div className="space-y-4">
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-24 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-[1920px] mx-auto px-[50px]">
          {/* Breadcrumb */}
          <nav className="mb-8 text-sm">
            <ol className="flex items-center space-x-2 text-gray-600">
              <li><Link href="/" className="hover:text-[#173a6a]">Home</Link></li>
              <li>/</li>
              <li><Link href="/catalog" className="hover:text-[#173a6a]">Products</Link></li>
              {category && (
                <>
                  <li>/</li>
                  <li><Link href={`/catalog?category=${category.$id}`} className="hover:text-[#173a6a]">{category.name}</Link></li>
                </>
              )}
              <li>/</li>
              <li className="text-gray-900 font-medium truncate">{product.name}</li>
            </ol>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Images */}
            <div className="space-y-4">
              <div className="bg-white rounded-lg overflow-hidden shadow-lg sticky top-8">
                <div className="aspect-square bg-gray-100 flex items-center justify-center relative group">
                  {product.media_id ? (
                    <img
                      src={getImageSrc(product.media_id)}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to placeholder if image fails to load
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                        if (fallback) fallback.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  {/* Fallback icon - shown if no media_id or image fails to load */}
                  <div className={`text-gray-400 text-6xl fallback-icon ${product.media_id ? 'hidden' : ''}`}>📦</div>
                  
                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {product.is_featured && (
                      <span className="flex items-center gap-1 px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-800 rounded">
                        <Star className="h-4 w-4" />
                        Featured
                      </span>
                    )}
                    {product.is_new && (
                      <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded">
                        New Arrival
                      </span>
                    )}
                    {savingsPercent > 0 && (
                      <span className="px-3 py-1 text-sm font-medium bg-red-500 text-white rounded">
                        Save {savingsPercent}%
                      </span>
                    )}
                  </div>

                  {/* Wishlist & Share */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-3 bg-white rounded-full shadow-md hover:bg-gray-50">
                      <Heart className="h-5 w-5 text-gray-600" />
                    </button>
                    <button className="p-3 bg-white rounded-full shadow-md hover:bg-gray-50">
                      <Share2 className="h-5 w-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              {/* Brand */}
              {brand && (
                <Link href={`/catalog?brand=${brand.$id}`} className="inline-block">
                  <span className="text-sm text-gray-600 hover:text-[#173a6a] font-medium">
                    {brand.name}
                  </span>
                </Link>
              )}

              {/* Title */}
              <h1 className="text-4xl font-bold text-gray-900">{product.name}</h1>

              {/* Price */}
              <div className="border-t border-b py-6">
                <div className="flex items-baseline gap-4">
                  <span className="text-4xl font-bold text-[#173a6a]">
                    ${currentPrice.toFixed(2)}
                  </span>
                  {savings > 0 && (
                    <>
                      <span className="text-2xl text-gray-500 line-through">
                        ${product.price.toFixed(2)}
                      </span>
                      <span className="text-lg font-medium text-red-600">
                        Save ${savings.toFixed(2)}
                      </span>
                    </>
                  )}
                </div>
                {product.units > 0 && (
                  <p className="text-sm text-green-600 mt-2 flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    In Stock ({product.units} available)
                  </p>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700 leading-relaxed">{product.description}</p>
                </div>
              )}

              {/* Quantity Selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Quantity (Min: {product.min_order_quantity})
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-gray-300 rounded-md">
                    <button
                      onClick={() => setQuantity(Math.max(product.min_order_quantity, quantity - 1))}
                      className="px-4 py-3 hover:bg-gray-100 transition-colors"
                      disabled={quantity <= product.min_order_quantity}
                    >
                      -
                    </button>
                    <span className="px-6 py-3 font-medium min-w-[4rem] text-center border-x">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(product.units, quantity + 1))}
                      className="px-4 py-3 hover:bg-gray-100 transition-colors"
                      disabled={quantity >= product.units}
                    >
                      +
                    </button>
                  </div>
                  <span className="text-sm text-gray-600">
                    Max: {product.units} available
                  </span>
                </div>
              </div>

              {/* Add to Cart Button */}
              <div className="space-y-3">
                <button
                  onClick={handleAddToCart}
                  disabled={product.units === 0}
                  className={`w-full py-4 px-6 rounded-md font-semibold text-lg flex items-center justify-center gap-3 transition-colors ${
                    product.units === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : addedToCart
                      ? 'bg-green-600 text-white'
                      : 'bg-[#173a6a] text-white hover:bg-[#1e4a7a]'
                  }`}
                >
                  {addedToCart ? (
                    <>
                      <Check className="h-6 w-6" />
                      Added to Cart!
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-6 w-6" />
                      Add to Cart
                    </>
                  )}
                </button>

                <Link href="/cart">
                  <button className="w-full py-4 px-6 border-2 border-[#173a6a] text-[#173a6a] rounded-md font-semibold text-lg hover:bg-[#173a6a] hover:text-white transition-colors">
                    View Cart
                  </button>
                </Link>
              </div>

              {/* Currency Converter */}
              <CurrencyConverter 
                basePrice={currentPrice}
                baseCurrency="USD"
                className="mb-6"
              />

              {/* Trust Signals */}
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Truck className="h-5 w-5 text-[#173a6a] mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Free Shipping</h4>
                    <p className="text-sm text-gray-600">On orders over $50</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <RotateCcw className="h-5 w-5 text-[#173a6a] mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-900">30-Day Returns</h4>
                    <p className="text-sm text-gray-600">Easy returns within 30 days</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-[#173a6a] mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Secure Checkout</h4>
                    <p className="text-sm text-gray-600">100% secure payment</p>
                  </div>
                </div>
              </div>

              {/* Product Meta */}
              <div className="border-t pt-6 space-y-2 text-sm">
                <div className="flex gap-2">
                  <span className="text-gray-600 font-medium">SKU:</span>
                  <span className="text-gray-900">{product.$id.substring(0, 12)}</span>
                </div>
                {category && (
                  <div className="flex gap-2">
                    <span className="text-gray-600 font-medium">Category:</span>
                    <Link href={`/catalog?category=${category.$id}`} className="text-[#173a6a] hover:underline">
                      {category.name}
                    </Link>
                  </div>
                )}
                {brand && (
                  <div className="flex gap-2">
                    <span className="text-gray-600 font-medium">Brand:</span>
                    <Link href={`/catalog?brand=${brand.$id}`} className="text-[#173a6a] hover:underline">
                      {brand.name}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Related Products Section */}
          <div className="mt-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">You May Also Like</h2>
              <Link href="/catalog" className="text-[#173a6a] hover:text-[#1e4a7a] font-medium">
                View All Products →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
