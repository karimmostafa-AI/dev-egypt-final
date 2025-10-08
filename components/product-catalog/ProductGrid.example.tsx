import ProductGrid from './ProductGrid';
import type { Product } from '@/types/product-catalog';

// Example usage of ProductGrid component
const ProductGridExample = () => {
  // Mock product data
  const exampleProducts: Product[] = [
    {
      id: '1',
      name: 'Classic White Lab Coat',
      price: 89.99,
      salePrice: 69.99,
      images: [
        { url: '/products/lab-coat-white.jpg', alt: 'Classic White Lab Coat' },
        { url: '/products/lab-coat-white-back.jpg', alt: 'Classic White Lab Coat - Back View', colorName: 'White' }
      ],
      colors: [
        { name: 'White', hex: '#FFFFFF', imageUrl: '/products/lab-coat-white.jpg' },
        { name: 'Navy', hex: '#000080', imageUrl: '/products/lab-coat-navy.jpg' }
      ],
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      brand: 'Dev Egypt',
      rating: 4.5,
      reviewCount: 127,
      isOnSale: true,
      category: 'lab-coats',
    },
    {
      id: '2',
      name: 'Comfort Stretch Scrub Top',
      price: 34.99,
      images: [
        { url: '/products/scrub-top-blue.jpg', alt: 'Comfort Stretch Scrub Top' }
      ],
      colors: [
        { name: 'Royal Blue', hex: '#4169E1', imageUrl: '/products/scrub-top-blue.jpg' },
        { name: 'Black', hex: '#000000', imageUrl: '/products/scrub-top-black.jpg' },
        { name: 'Pink', hex: '#FFC0CB', imageUrl: '/products/scrub-top-pink.jpg' }
      ],
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      brand: 'Cherokee',
      rating: 4.2,
      reviewCount: 89,
      isOnSale: false,
      category: 'scrub-tops',
    },
    {
      id: '3',
      name: 'Professional Nursing Shoes',
      price: 129.99,
      images: [
        { url: '/products/nursing-shoes-white.jpg', alt: 'Professional Nursing Shoes' }
      ],
      colors: [
        { name: 'White', hex: '#FFFFFF', imageUrl: '/products/nursing-shoes-white.jpg' },
        { name: 'Black', hex: '#000000', imageUrl: '/products/nursing-shoes-black.jpg' }
      ],
      sizes: ['6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11'],
      brand: 'Dansko',
      rating: 4.8,
      reviewCount: 203,
      isOnSale: false,
      category: 'shoes',
    }
  ];

  const handleAddToCart = (productId: string) => {
    console.log(`Adding product ${productId} to cart`);
    // In a real app, this would dispatch an action to add the product to cart
  };

  const handleAddToWishlist = (productId: string) => {
    console.log(`Adding product ${productId} to wishlist`);
    // In a real app, this would dispatch an action to add the product to wishlist
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Grid Examples</h2>
      
      {/* Normal grid with products */}
      <section className="mb-12">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Normal Product Grid</h3>
        <ProductGrid
          products={exampleProducts}
          onAddToCart={handleAddToCart}
          onAddToWishlist={handleAddToWishlist}
        />
      </section>

      {/* Loading state */}
      <section className="mb-12">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Loading State</h3>
        <ProductGrid
          products={[]}
          loading={true}
          onAddToCart={handleAddToCart}
          onAddToWishlist={handleAddToWishlist}
        />
      </section>

      {/* Empty state */}
      <section className="mb-12">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Empty State</h3>
        <ProductGrid
          products={[]}
          onAddToCart={handleAddToCart}
          onAddToWishlist={handleAddToWishlist}
        />
      </section>

      {/* Custom styling */}
      <section className="mb-12">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Custom Styling</h3>
        <ProductGrid
          products={exampleProducts.slice(0, 2)}
          onAddToCart={handleAddToCart}
          onAddToWishlist={handleAddToWishlist}
          className="bg-gray-50 rounded-lg"
        />
      </section>

      {/* Large number of products */}
      <section className="mb-12">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Many Products</h3>
        <ProductGrid
          products={[
            ...exampleProducts,
            ...exampleProducts.map(p => ({ ...p, id: p.id + '-copy1' })),
            ...exampleProducts.map(p => ({ ...p, id: p.id + '-copy2' })),
            ...exampleProducts.map(p => ({ ...p, id: p.id + '-copy3' }))
          ]}
          onAddToCart={handleAddToCart}
          onAddToWishlist={handleAddToWishlist}
        />
      </section>
    </div>
  );
};

export default ProductGridExample;