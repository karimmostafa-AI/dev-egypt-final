// Brand Landing Page Editor
// Edit and manage brand-specific landing pages

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Eye, Plus, RefreshCw } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import BrandLandingPageEditor from '@/components/admin/BrandLandingPageEditor';
import type { BrandLandingPage } from '@/lib/brand-landing-service';
import { createBrandLandingService } from '@/lib/brand-landing-service';
import { createImagePlaceholderService } from '@/lib/image-placeholder-service';

interface Brand {
  $id: string;
  name: string;
  prefix: string;
  status: boolean;
}

interface BrandLandingPageProps {
  params: {
    id: string;
  };
}

export default function BrandLandingPage({ params }: BrandLandingPageProps) {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [landingPage, setLandingPage] = useState<BrandLandingPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  // Initialize services
  const initializeServices = async () => {
    try {
      const { createAdminClient } = await import('@/lib/appwrite-admin');
      const { databases } = await createAdminClient();
      return { databases };
    } catch (error) {
      console.error('Failed to initialize services:', error);
      throw error;
    }
  };

 const [services, setServices] = useState<{ databases: any } | null>(null);
 const [serviceError, setServiceError] = useState<string | null>(null);

 useEffect(() => {
   initializeServices()
     .then(setServices)
     .catch((error) => {
       console.error('Service initialization failed:', error);
       setServiceError('Failed to initialize services');
     });
 }, []);

 const brandLandingService = services ? createBrandLandingService(services.databases) : null;
 const placeholderService = createImagePlaceholderService();

  // Fetch brand data
  useEffect(() => {
    const fetchBrand = async () => {
      try {
        const response = await fetch(`/api/admin/brands?brandId=${params.id}`);
        const data = await response.json();

        if (data.error) {
          console.error('Error fetching brand:', data.error);
          return;
        }

        setBrand(data.brand);
      } catch (error) {
        console.error('Failed to fetch brand:', error);
      }
    };

    const fetchLandingPage = async () => {
      if (!brandLandingService) return;

      try {
        const page = await brandLandingService.getLandingPage(params.id);
        setLandingPage(page);
      } catch (error) {
        console.error('Failed to fetch landing page:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBrand();
    fetchLandingPage();
  }, [params.id]);

  const handleSave = async (page: BrandLandingPage) => {
    if (!brandLandingService) {
      throw new Error('Service not initialized');
    }

    setSaving(true);
    try {
      await brandLandingService.updateLandingPage(page.brandId, page);
      setLandingPage(page);
    } catch (error) {
      console.error('Error saving landing page:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = (page: BrandLandingPage) => {
    // Open preview in new tab
    const previewUrl = `/brand/${brand?.prefix.toLowerCase()}?preview=true`;
    window.open(previewUrl, '_blank');
  };

  if (serviceError) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/brands">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Service Error</h1>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to initialize services</h3>
          <p className="text-gray-600 mb-4">{serviceError}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (loading || !services || !brandLandingService) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/brands">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Loading...</h1>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">
            {loading ? 'Loading brand landing page...' : 'Initializing services...'}
          </p>
        </div>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/brands">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Brand Not Found</h1>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">The requested brand could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/brands">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Edit {brand.name} Landing Page
            </h1>
            <p className="text-muted-foreground">
              Customize the brand landing page content and sections
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" asChild>
            <Link href={`/brand/${brand.prefix.toLowerCase()}`} target="_blank">
              <Eye className="mr-2 h-4 w-4" />
              View Live Page
            </Link>
          </Button>
        </div>
      </div>

      {/* Landing Page Editor */}
      <BrandLandingPageEditor
        brandId={brand.$id}
        initialPage={landingPage || undefined}
        onSave={handleSave}
        onPreview={handlePreview}
        autoSave={true}
        autoSaveInterval={30000}
      />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks for managing this brand's landing page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <Link href={`/admin/brands/${brand.$id}/edit`}>
                Edit Brand Details
              </Link>
            </Button>

            <Button variant="outline" asChild>
              <Link href={`/admin/products?brand=${brand.$id}`}>
                View Brand Products
              </Link>
            </Button>

            <Button variant="outline" onClick={() => {
              // Regenerate landing page
              if (landingPage && brandLandingService) {
                brandLandingService.updateLandingPage(landingPage.brandId, {
                  ...landingPage,
                  sections: landingPage.sections.map(section => ({
                    ...section,
                    title: `${brand.name} - ${section.title}`
                  }))
                }).catch(error => {
                  console.error('Error regenerating content:', error);
                });
              }
            }}>
              Regenerate Content
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}