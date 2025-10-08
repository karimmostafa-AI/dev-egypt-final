// Dynamic Brand Landing Page
// Displays brand-specific landing pages with dynamic content

import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import MainLayout from '@/components/MainLayout';
import { BrandLandingService, BrandLandingPage } from '@/lib/brand-landing-service';
import { createBrandLandingService } from '@/lib/brand-landing-service';
import { createImagePlaceholderService } from '@/lib/image-placeholder-service';
// Fixed: Import with exact case matching the filename BrandPageContent.tsx
import BrandPageContent from './BrandPageContent';

// Debug logging for import issue - Import should work with exact case matching
console.log('🔍 Debug: Attempting to import BrandPageContent');
console.log('🔍 Debug: Current working directory:', process.cwd());
console.log('🔍 Debug: Current file directory:', __dirname);
console.log('🔍 Debug: Import path being used:', './BrandPageContent');
console.log('🔍 Debug: Actual filename on disk: BrandPageContent.tsx');

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    // In a real implementation, this would fetch from the database
    // For now, return default metadata
    return {
      title: `Brand - ${params.slug} | Dev Egypt`,
      description: `Discover ${params.slug} products and brand information at Dev Egypt`,
      keywords: ['brand', params.slug, 'medical scrubs', 'healthcare uniforms'],
    };
  } catch (error) {
    return {
      title: 'Brand Not Found | Dev Egypt',
      description: 'The requested brand page could not be found',
    };
  }
}

// Generate static params for static generation (optional)
export async function generateStaticParams() {
  try {
    // In a real implementation, this would fetch all brand slugs from the database
    // For now, return empty array to use dynamic rendering
    return [];
  } catch (error) {
    console.error('Error generating static params for brands:', error);
    return [];
  }
}

interface BrandPageProps {
  params: {
    slug: string;
  };
}

export default async function BrandPage({ params }: BrandPageProps) {
  try {
    // Initialize services (in a real app, these would be injected or use singleton pattern)
    const brandLandingService = createBrandLandingService({} as any); // Placeholder for databases
    const placeholderService = createImagePlaceholderService();

    // Get brand landing page data
    const landingPage = await brandLandingService.getLandingPage(params.slug);

    if (!landingPage) {
      notFound();
    }

    return (
      <MainLayout>
        <BrandPageContent
          landingPage={landingPage}
          brandSlug={params.slug}
          placeholderService={placeholderService}
        />
      </MainLayout>
    );
  } catch (error) {
    console.error('Error loading brand page:', error);
    notFound();
  }
}