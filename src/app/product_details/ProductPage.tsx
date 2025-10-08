'use client';
import { useState } from 'react';
import Image from 'next/image';
import Button from '../../../components/ui/Button';
import Dropdown from '../../../components/ui/Dropdown';

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
  const [selectedColor, setSelectedColor] = useState('Royal');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [addEmbroidery, setAddEmbroidery] = useState(false);
  const [featuresExpanded, setFeaturesExpanded] = useState(true);

  const product: Product = {
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
    setQuantity(Math.max(1, quantity + change));
  };

  const handleAddToBag = () => {
    // Add to cart logic
    console.log('Added to bag:', {
      product: product.name,
      color: selectedColor,
      size: selectedSize,
      quantity,
      embroidery: addEmbroidery
    });
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
  };

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
  };

  return (
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
            {/* Product Images */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {/* Main product image based on selected color */}
                <div className="col-span-2 bg-neutral-light rounded-lg overflow-hidden">
                  <Image
                    src={product.images[selectedColor] || product.images['Royal']}
                    alt={`${product.name} - ${selectedColor}`}
                    width={454}
                    height={678}
                    className="w-full h-auto object-cover"
                  />
                </div>
                
                {/* Color variant thumbnails */}
                <div className="col-span-2 grid grid-cols-4 gap-2">
                  {product.colors.slice(0, 4).map((color) => (
                    <div 
                      key={color} 
                      className={`bg-neutral-light rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border-2 ${
                        selectedColor === color ? 'border-primary-background' : 'border-transparent'
                      }`}
                      onClick={() => setSelectedColor(color)}
                    >
                      <Image
                        src={product.images[color]}
                        alt={`${product.name} - ${color}`}
                        width={100}
                        height={150}
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              {/* Product Title and Rating */}
              <div className="space-y-2">
                <p className="text-sm font-normal text-black uppercase underline">
                  Butter-Soft Stretch
                </p>
                <h1 className="text-xl lg:text-2xl font-medium text-black leading-tight">
                  {product.name}
                </h1>
                <p className="text-sm font-normal text-text-muted uppercase">
                  Style # {product.style}
                </p>
                
                {/* Rating */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Image
                        key={i}
                        src={i < Math.floor(product.rating) ? "/images/img_component_7.svg" : "/images/img_component_7_orange_400.svg"}
                        alt="Star"
                        width={12}
                        height={14}
                        className="w-3 h-3"
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-neutral-dark">({product.reviewCount})</span>
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-2">
                <div className="flex items-end gap-2">
                  <span className="text-2xl lg:text-3xl font-medium text-primary-background">
                    {product.price.sale}
                  </span>
                  <span className="text-lg lg:text-xl font-normal text-text-light line-through">
                    {product.price.original}
                  </span>
                </div>
                <p className="text-sm font-medium text-black">
                  2X-3X add EGP 155.00, 4X-5X add EGP 255.00
                </p>
                <p className="text-base font-medium text-primary-background">
                  Sale! Ends 9/29/25
                </p>
              </div>

              {/* Color Selection */}
              <div className="space-y-4">
                <Dropdown
                  placeholder={selectedColor}
                  options={product.colors}
                  onSelect={handleColorSelect}
                  className="w-full"
                  fill_background_color="bg-neutral-light"
                />

                {/* Color Swatches */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-primary-background uppercase tracking-wide">
                        Available Colors: 
                      </p>
                      <p className="text-sm font-normal text-primary-background capitalize">
                        Select a color
                      </p>
                    </div>
                    
                    {/* Color Options */}
                    <div className="flex flex-wrap gap-2">
                      {product.colors.map((color) => (
                        <button 
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`w-11 h-11 rounded-full overflow-hidden border-2 transition-colors ${
                            selectedColor === color 
                              ? 'border-primary-background ring-2 ring-primary-background ring-opacity-50' 
                              : 'border-transparent hover:border-primary-background'
                          }`}
                        >
                          <Image 
                            src={product.images[color]} 
                            alt={`${color} color`} 
                            width={44} 
                            height={44} 
                            className="w-full h-full object-cover" 
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {selectedColor && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        ✓ Color <span className="font-semibold">{selectedColor}</span> selected
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Size Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-black uppercase tracking-wide">Size:</p>
                  <button className="text-sm font-normal text-black underline">Size Chart</button>
                </div>
                
                <div className="space-y-2">
                  <div className="grid grid-cols-5 gap-2">
                    {['XS', 'S', 'M', 'L', 'XL'].map((size) => (
                      <Button
                        key={size}
                        text={size}
                        variant="secondary"
                        className={`text-sm font-normal text-black border border-neutral-light rounded-base px-4 py-3 transition-all duration-200 ${
                          selectedSize === size 
                            ? 'bg-primary-background text-white shadow-lg transform scale-105' 
                            : 'bg-neutral-light hover:bg-neutral-background hover:border-primary-background'
                        }`}
                        onClick={() => handleSizeSelect(size)}
                      />
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    {['2X', '3X', '4X', '5X'].map((size) => (
                      <Button
                        key={size}
                        text={size}
                        variant="secondary"
                        className={`text-sm font-normal text-black border border-neutral-light rounded-base px-4 py-3 transition-all duration-200 ${
                          selectedSize === size 
                            ? 'bg-primary-background text-white shadow-lg transform scale-105' 
                            : 'bg-neutral-light hover:bg-neutral-background hover:border-primary-background'
                        }`}
                        onClick={() => handleSizeSelect(size)}
                      />
                    ))}
                  </div>
                </div>
                
                {selectedSize && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      ✓ Size <span className="font-semibold">{selectedSize}</span> selected
                    </p>
                  </div>
                )}
              </div>

              {/* Add Embroidery */}
              <div className="bg-neutral-light rounded-base p-4">
                <div className="flex items-start gap-4">
                  <div className="w-5 h-5 border border-text-light rounded-xs bg-white mt-1">
                    {addEmbroidery && (
                      <div className="w-full h-full bg-primary-background rounded-xs"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-black">Add Embroidery</h4>
                      <p className="text-sm font-normal text-black">From $7.99</p>
                      <p className="text-xs font-normal text-text-light">
                        Select options once you 'Add to Bag'
                      </p>
                    </div>
                  </div>
                </div>
              </div>

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
                  text="ADD TO BAG"
                  variant="primary"
                  size="medium"
                  className="w-full bg-primary-background text-white font-normal uppercase text-base px-8 py-4 rounded-base hover:bg-primary-dark"
                  onClick={handleAddToBag}
                />
              </div>

              {/* Finish Your Look */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-base font-normal text-neutral-dark">Finish Your Look in </span>
                  <span className="text-base font-normal text-black underline capitalize">{selectedColor}</span>
                </div>
                
                <div className="bg-neutral-light rounded-base p-4">
                  <div className="flex flex-col items-center space-y-2">
                    <Image 
                      src="/images/img_button_margin.svg" 
                      alt="Royal Color" 
                      width={44} 
                      height={44}
                      className="w-11 h-11"
                    />
                    <span className="text-xs font-normal text-black">Royal</span>
                  </div>
                </div>
              </div>

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
                <Image 
                  src="/images/img_button_margin_light_blue_900.svg" 
                  alt="Royal Color" 
                  width={38} 
                  height={38}
                  className="mb-3"
                />
                <span className="text-xs font-bold text-black">Royal</span>
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
  )
}