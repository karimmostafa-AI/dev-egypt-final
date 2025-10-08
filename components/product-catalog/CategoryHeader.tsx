'use client';

import { CategoryHeaderProps } from '@/types/product-catalog';
import BreadCrumb from '../ui/BreadCrumb';

const CategoryHeader = ({ 
  category, 
  productCount, 
  breadcrumbs 
}: CategoryHeaderProps) => {
  // Convert our breadcrumb items to the format expected by the BreadCrumb component
  const breadcrumbItems = breadcrumbs.map((item, index) => ({
    label: item.label,
    href: item.href,
    isActive: index === breadcrumbs.length - 1, // Last item is active
  }));

  return (
    <div className="bg-white border-b border-[var(--ua-gray-border)] py-4 px-6">
      <div className="max-w-[1920px] mx-auto px-[50px]">
        {/* Breadcrumb Navigation */}
        <div className="mb-3">
          <BreadCrumb 
            items={breadcrumbItems}
            separator=">"
            variant="default"
            size="small"
          />
        </div>
        
        {/* Category Title and Product Count */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 capitalize">
              {category}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {productCount === 1 
                ? `${productCount} product` 
                : `${productCount} products`
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryHeader;