import CategoryHeader from './CategoryHeader';
import { BreadcrumbItem } from '@/types/product-catalog';

// Example usage of CategoryHeader component
export default function CategoryHeaderExample() {
  // Example breadcrumb data
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Medical Apparel', href: '/medical-apparel' },
    { label: 'Scrubs', href: '/medical-apparel/scrubs' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-4">Basic Category Header</h2>
        <CategoryHeader
          category="scrubs"
          productCount={42}
          breadcrumbs={breadcrumbs}
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Single Product</h2>
        <CategoryHeader
          category="lab coats"
          productCount={1}
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Medical Apparel', href: '/medical-apparel' },
            { label: 'Lab Coats', href: '/medical-apparel/lab-coats' },
          ]}
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">No Products (Filtered)</h2>
        <CategoryHeader
          category="surgical caps"
          productCount={0}
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Medical Apparel', href: '/medical-apparel' },
            { label: 'Surgical Caps', href: '/medical-apparel/surgical-caps' },
          ]}
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Long Category Name</h2>
        <CategoryHeader
          category="compression socks and hosiery"
          productCount={156}
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Medical Apparel', href: '/medical-apparel' },
            { label: 'Accessories', href: '/medical-apparel/accessories' },
            { label: 'Compression Socks and Hosiery', href: '/medical-apparel/accessories/compression-socks' },
          ]}
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Minimal Breadcrumbs</h2>
        <CategoryHeader
          category="shoes"
          productCount={89}
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Shoes', href: '/shoes' },
          ]}
        />
      </div>
    </div>
  );
}