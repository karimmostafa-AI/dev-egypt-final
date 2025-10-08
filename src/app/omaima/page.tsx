'use client';

import Link from "next/link";
import Image from "next/image";
import MainLayout from "@/components/MainLayout";
import { ShoppingBag, Star, Shield, Truck, RefreshCw } from "lucide-react";

export default function OmaimaPage() {
  return (
    <MainLayout>
      <div className="font-sans w-full min-h-screen bg-white text-black">
        {/* Hero Section with Omaima Image */}
        <section className="w-full bg-white px-4 sm:px-6 lg:px-8 pb-7 md:pb-12">
          <div className="max-w-7xl mx-auto">
            <div className="w-full min-h-[900px] lg:min-h-[1000px] relative overflow-hidden rounded-2xl shadow-2xl bg-gray-100">
              {/* Hero Background Image */}
              <div 
                className="absolute inset-0 bg-no-repeat"
                style={{ 
                  backgroundImage: 'url(/images/brands/hero-omaima.jpg)',
                  backgroundPosition: 'center',
                  backgroundSize: 'contain'
                }}
              />
              
              {/* Text readability overlay - very subtle */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50 rounded-2xl" />
            
              {/* Hero Content */}
              <div className="absolute inset-0 flex items-end justify-center pb-16">
                <div className="text-center text-white max-w-3xl px-6">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">
                    OMAIMA
                  </h1>
                  
                  <p className="text-base md:text-lg lg:text-xl mb-6 leading-relaxed font-light">
                    Premium Professional Wear for the Modern Workforce
                  </p>
                  
                  <div className="text-sm md:text-base mb-8 max-w-xl mx-auto leading-relaxed">
                    <p className="mb-3">
                      Discover the perfect blend of style, comfort, and functionality with Omaima's 
                      exclusive collection of uniforms, medical wear, and formal attire.
                    </p>
                  </div>
                  
                  {/* Call to Action Button */}
                  <Link
                    href="/catalog?brand=omaima"
                    className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 text-base font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl rounded-md"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    Shop Omaima Collection
                  </Link>
                </div>
              </div>
            </div>

            {/* Shop Categories Grid */}
            <div className="mt-8">
              <h2 className="text-center text-white text-xl lg:text-2xl font-semibold tracking-wide mb-6">
                SHOP OMAIMA STRETCH &gt;
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-0">
                {/* Tops */}
                <Link href="/catalog?brand=omaima&category=tops" className="group relative block border-r border-white/30 last:border-none">
                  <img src="/images/brands/T6_img1_ShopCategories_Tops_desk_asset.webp" alt="Shop Tops" className="w-full h-full object-cover aspect-[4/5]" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                  <span className="absolute inset-0 flex items-center justify-center text-white text-sm lg:text-base font-bold tracking-wide">
                    SHOP TOPS &gt;
                  </span>
                </Link>
                {/* Pants */}
                <Link href="/catalog?brand=omaima&category=pants" className="group relative block border-r border-white/30 last:border-none">
                  <img src="/images/brands/T6_img2_ShopCategories_Pants_desk_asset.jpg" alt="Shop Pants" className="w-full h-full object-cover aspect-[4/5]" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                  <span className="absolute inset-0 flex items-center justify-center text-white text-sm lg:text-base font-bold tracking-wide">
                    SHOP PANTS &gt;
                  </span>
                </Link>
                {/* Jackets */}
                <Link href="/catalog?brand=omaima&category=jackets" className="group relative block border-r border-white/30 last:border-none">
                  <img src="/images/brands/T6_img4_ShopCategories_Jackets_desk_asset.webp" alt="Shop Jackets" className="w-full h-full object-cover aspect-[4/5]" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                  <span className="absolute inset-0 flex items-center justify-center text-white text-sm lg:text-base font-bold tracking-wide">
                    SHOP JACKETS &gt;
                  </span>
                </Link>
                {/* Jumpsuit */}
                <Link href="/catalog?brand=omaima&category=jumpsuit" className="group relative block">
                  <img src="/images/brands/T6_img3_ShopCategories_Jumpsuit_desk_asset.webp" alt="Shop Jumpsuit" className="w-full h-full object-cover aspect-[4/5]" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                  <span className="absolute inset-0 flex items-center justify-center text-white text-sm lg:text-base font-bold tracking-wide">
                    SHOP JUMPSUIT &gt;
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Brand Story Section */}
        <section className="w-full py-16 lg:py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold mb-6 text-gray-900">
                  About Omaima
                </h2>
                <div className="space-y-6 text-gray-700 text-lg leading-relaxed">
                  <p>
                    Omaima represents the pinnacle of professional fashion, combining 
                    traditional craftsmanship with modern innovation. Our brand is 
                    dedicated to creating exceptional clothing that empowers professionals 
                    across various industries.
                  </p>
                  <p>
                    From healthcare workers to corporate professionals, Omaima's 
                    meticulously designed garments provide the perfect balance of 
                    comfort, durability, and sophistication that today's workforce demands.
                  </p>
                  <p>
                    Every piece in our collection is thoughtfully crafted using premium 
                    materials and cutting-edge techniques, ensuring that you look and 
                    feel your best throughout your workday.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <Shield className="w-8 h-8 text-red-600 mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-2">Quality Guarantee</h3>
                    <p className="text-sm text-gray-600">Premium materials and superior construction</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <Star className="w-8 h-8 text-red-600 mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-2">Professional Design</h3>
                    <p className="text-sm text-gray-600">Stylish and functional for any workplace</p>
                  </div>
                </div>
                <div className="space-y-4 mt-8">
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <Truck className="w-8 h-8 text-red-600 mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-2">Fast Delivery</h3>
                    <p className="text-sm text-gray-600">Quick shipping across Egypt</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <RefreshCw className="w-8 h-8 text-red-600 mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-2">Easy Returns</h3>
                    <p className="text-sm text-gray-600">Hassle-free return policy</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Product Categories */}
        <section className="w-full py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold mb-6 text-gray-900">
                Omaima Collections
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Explore our carefully curated collections designed for 
                professionals who value quality and style
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Uniform Collection */}
              <div className="group cursor-pointer">
                <Link href="/catalog?brand=omaima&category=uniform">
                  <div className="relative overflow-hidden rounded-lg shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <div className="aspect-[4/5] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                          <ShoppingBag className="w-8 h-8 text-red-600" />
                        </div>
                        <p className="text-sm">Uniform Collection</p>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300" />
                  </div>
                  <div className="mt-4 text-center">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Uniforms</h3>
                    <p className="text-gray-600">Professional uniforms for all industries</p>
                  </div>
                </Link>
              </div>
              
              {/* Medical Collection */}
              <div className="group cursor-pointer">
                <Link href="/catalog?brand=omaima&category=medical">
                  <div className="relative overflow-hidden rounded-lg shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <div className="aspect-[4/5] bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                      <div className="text-center text-blue-600">
                        <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                          <Shield className="w-8 h-8 text-blue-600" />
                        </div>
                        <p className="text-sm">Medical Collection</p>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300" />
                  </div>
                  <div className="mt-4 text-center">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Medical Wear</h3>
                    <p className="text-gray-600">Premium scrubs and medical uniforms</p>
                  </div>
                </Link>
              </div>
              
              {/* Formal Collection */}
              <div className="group cursor-pointer">
                <Link href="/catalog?brand=omaima&category=formal">
                  <div className="relative overflow-hidden rounded-lg shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <div className="aspect-[4/5] bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="w-16 h-16 mx-auto mb-4 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                          <Star className="w-8 h-8 text-white" />
                        </div>
                        <p className="text-sm">Formal Collection</p>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300" />
                  </div>
                  <div className="mt-4 text-center">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Formal Wear</h3>
                    <p className="text-gray-600">Elegant formal attire for professionals</p>
                  </div>
                </Link>
              </div>
            </div>
            
            {/* View All Products Button */}
            <div className="text-center mt-12">
              <Link
                href="/catalog?brand=omaima"
                className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-8 py-3 text-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                View All Omaima Products
                <ShoppingBag className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="w-full py-16 bg-gray-900 text-white">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Ready to Elevate Your Professional Wardrobe?
            </h2>
            <p className="text-lg lg:text-xl mb-8 text-gray-300">
              Join thousands of professionals who trust Omaima for their workwear needs
            </p>
            <Link
              href="/catalog?brand=omaima"
              className="inline-flex items-center gap-3 bg-red-600 hover:bg-red-700 text-white px-10 py-4 text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <ShoppingBag className="w-6 h-6" />
              Shop Now
            </Link>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}