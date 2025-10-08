// Brand Page Content Component
// Renders the dynamic content for brand landing pages

import React from 'react';
import { BrandLandingPage } from '@/lib/brand-landing-service';
import { PlaceholderService } from '@/lib/image-placeholder-service';
import LazyImage from '@/components/ui/LazyImage';

interface BrandPageContentProps {
  landingPage: BrandLandingPage;
  brandSlug: string;
  placeholderService: PlaceholderService;
}

const BrandPageContent: React.FC<BrandPageContentProps> = ({
  landingPage,
  brandSlug,
  placeholderService
}) => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 lg:py-40">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              {landingPage.hero.title}
            </h1>
            {landingPage.hero.subtitle && (
              <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto">
                {landingPage.hero.subtitle}
              </p>
            )}
            {landingPage.hero.ctaText && landingPage.hero.ctaUrl && (
              <a
                href={landingPage.hero.ctaUrl}
                className="inline-block px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors text-lg"
              >
                {landingPage.hero.ctaText}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Page Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {landingPage.sections
          .filter(section => section.isActive)
          .sort((a, b) => a.order - b.order)
          .map((section) => (
            <SectionRenderer
              key={section.id}
              section={section}
              brandSlug={brandSlug}
              placeholderService={placeholderService}
            />
          ))}
      </div>
    </div>
  );
};

// Section Renderer Component
interface SectionRendererProps {
  section: BrandLandingPage['sections'][0];
  brandSlug: string;
  placeholderService: PlaceholderService;
}

const SectionRenderer: React.FC<SectionRendererProps> = ({
  section,
  brandSlug,
  placeholderService
}) => {
  switch (section.type) {
    case 'products':
      return <ProductGridSection section={section} brandSlug={brandSlug} />;

    case 'carousel':
      return <CarouselSection section={section} brandSlug={brandSlug} />;

    case 'features':
      return <FeaturesSection section={section} />;

    case 'testimonial':
      return <TestimonialSection section={section} />;

    case 'cta':
      return <CallToActionSection section={section} />;

    default:
      return <GenericSection section={section} />;
  }
};

// Product Grid Section
interface ProductGridSectionProps {
  section: BrandLandingPage['sections'][0];
  brandSlug: string;
}

const ProductGridSection: React.FC<ProductGridSectionProps> = ({ section, brandSlug }) => {
  // In a real implementation, this would fetch products for the brand
  const mockProducts = [
    {
      id: '1',
      name: 'Premium Scrub Top',
      price: 45.99,
      image: '/placeholder-product.jpg',
      color: 'Navy Blue'
    },
    {
      id: '2',
      name: 'Comfortable Scrub Pants',
      price: 55.99,
      image: '/placeholder-product.jpg',
      color: 'Black'
    },
    {
      id: '3',
      name: 'Professional Lab Coat',
      price: 65.99,
      image: '/placeholder-product.jpg',
      color: 'White'
    }
  ];

  return (
    <section className="mb-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">{section.title}</h2>
        {section.content.description && (
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {section.content.description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {mockProducts.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="aspect-square bg-gray-100">
              <LazyImage
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
                width={400}
                height={400}
              />
            </div>
            <div className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
              <p className="text-sm text-gray-600 mb-3">{product.color}</p>
              <p className="text-lg font-bold text-gray-900">${product.price}</p>
              <button className="w-full mt-4 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                View Product
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// Carousel Section
interface CarouselSectionProps {
  section: BrandLandingPage['sections'][0];
  brandSlug: string;
}

const CarouselSection: React.FC<CarouselSectionProps> = ({ section, brandSlug }) => {
  const slides = section.content.slides || [];

  return (
    <section className="mb-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">{section.title}</h2>
      </div>

      <div className="relative">
        <div className="overflow-hidden rounded-lg">
          <div className="flex transition-transform duration-300">
            {slides.map((slide: any, index: number) => (
              <div key={index} className="w-full flex-shrink-0">
                <div className="aspect-video bg-gray-100">
                  {slide.imageUrl ? (
                    <LazyImage
                      src={slide.imageUrl}
                      alt={slide.title || `Slide ${index + 1}`}
                      className="w-full h-full object-cover"
                      width={1200}
                      height={600}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-100 to-purple-100">
                      <span className="text-gray-500 text-lg">Slide {index + 1}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Carousel Controls */}
        {slides.length > 1 && (
          <div className="flex justify-center mt-4 space-x-2">
            {slides.map((_: any, index: number) => (
              <button
                key={index}
                className="w-3 h-3 rounded-full bg-gray-300 hover:bg-gray-500 transition-colors"
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

// Features Section
interface FeaturesSectionProps {
  section: BrandLandingPage['sections'][0];
}

const FeaturesSection: React.FC<FeaturesSectionProps> = ({ section }) => {
  const features = section.content.items || [];

  return (
    <section className="mb-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">{section.title}</h2>
        {section.content.description && (
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {section.content.description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature: any, index: number) => (
          <div key={index} className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
            <p className="text-gray-600">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

// Testimonial Section
interface TestimonialSectionProps {
  section: BrandLandingPage['sections'][0];
}

const TestimonialSection: React.FC<TestimonialSectionProps> = ({ section }) => {
  const testimonials = section.content.quotes || [];

  return (
    <section className="mb-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">{section.title}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {testimonials.map((testimonial: any, index: number) => (
          <div key={index} className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center mb-4">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className="w-5 h-5 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-gray-700 mb-4">"{testimonial.text}"</p>
            <div>
              <p className="font-semibold text-gray-900">{testimonial.author}</p>
              {testimonial.role && (
                <p className="text-sm text-gray-600">{testimonial.role}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// Call to Action Section
interface CallToActionSectionProps {
  section: BrandLandingPage['sections'][0];
}

const CallToActionSection: React.FC<CallToActionSectionProps> = ({ section }) => {
  const content = section.content;

  return (
    <section className="mb-16">
      <div
        className="rounded-lg p-12 text-center"
        style={{
          backgroundColor: content.backgroundColor || '#2563eb',
          color: content.textColor || '#ffffff'
        }}
      >
        <h2 className="text-3xl font-bold mb-4">{content.title}</h2>
        <p className="text-xl mb-8 opacity-90">{content.description}</p>
        {content.buttonText && content.buttonUrl && (
          <a
            href={content.buttonUrl}
            className="inline-block px-8 py-4 bg-white text-current font-semibold rounded-lg hover:bg-gray-100 transition-colors text-lg"
          >
            {content.buttonText}
          </a>
        )}
      </div>
    </section>
  );
};

// Generic Section (fallback)
interface GenericSectionProps {
  section: BrandLandingPage['sections'][0];
}

const GenericSection: React.FC<GenericSectionProps> = ({ section }) => {
  return (
    <section className="mb-16">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">{section.title}</h2>
        <div className="bg-gray-50 rounded-lg p-8">
          <p className="text-gray-600">
            This section type ({section.type}) is not yet implemented.
          </p>
        </div>
      </div>
    </section>
  );
};

export default BrandPageContent;