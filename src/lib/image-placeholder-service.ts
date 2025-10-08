// Image Placeholder Service
// Generates placeholder images for brand landing pages and provides image recommendations

export interface PlaceholderImage {
  sectionId: string;
  sectionType: string;
  placeholderUrl: string;
  recommendedSize: { width: number; height: number };
  altText: string;
  category?: string;
  tags?: string[];
}

export interface ImageRecommendation {
  sectionType: string;
  recommendedSizes: Array<{ width: number; height: number; name: string }>;
  bestPractices: string[];
  examples: string[];
}

export interface PlaceholderService {
  generatePlaceholder(sectionType: string, dimensions: { width: number; height: number }): string;
  generatePlaceholdersForSections(sections: Array<{ id: string; type: string }>): PlaceholderImage[];
  getImageRecommendations(sectionType: string): ImageRecommendation;
  generateBrandSpecificPlaceholders(brandId: string, sections: Array<{ id: string; type: string }>): PlaceholderImage[];
  getPlaceholderCategories(): Array<{ id: string; name: string; description: string }>;
}

class ImagePlaceholderManager implements PlaceholderService {
  private readonly placeholderBaseUrl = 'https://via.placeholder.com';
  private readonly unsplashBaseUrl = 'https://images.unsplash.com/photo';

  // Placeholder categories for different types of images
  private readonly placeholderCategories = [
    {
      id: 'fashion',
      name: 'Fashion & Apparel',
      description: 'Clothing, accessories, and lifestyle imagery'
    },
    {
      id: 'products',
      name: 'Product Photography',
      description: 'Clean product shots and commercial imagery'
    },
    {
      id: 'lifestyle',
      name: 'Lifestyle',
      description: 'People, environments, and real-life scenarios'
    },
    {
      id: 'abstract',
      name: 'Abstract & Patterns',
      description: 'Geometric patterns, textures, and abstract designs'
    },
    {
      id: 'nature',
      name: 'Nature & Environment',
      description: 'Natural landscapes, plants, and outdoor scenes'
    }
  ];

  // Image recommendations for different section types
  private readonly imageRecommendations: Record<string, ImageRecommendation> = {
    hero: {
      sectionType: 'hero',
      recommendedSizes: [
        { width: 1920, height: 800, name: 'Desktop Hero' },
        { width: 1200, height: 600, name: 'Tablet Hero' },
        { width: 800, height: 600, name: 'Mobile Hero' }
      ],
      bestPractices: [
        'Use high-impact, aspirational imagery',
        'Ensure text is readable with good contrast',
        'Keep important elements in the center third',
        'Use brand colors and maintain consistency'
      ],
      examples: [
        'Model wearing your products',
        'Beautiful lifestyle scene',
        'Clean product showcase',
        'Brand story imagery'
      ]
    },
    carousel: {
      sectionType: 'carousel',
      recommendedSizes: [
        { width: 1200, height: 600, name: 'Carousel Slide' },
        { width: 800, height: 400, name: 'Mobile Carousel' }
      ],
      bestPractices: [
        'Use consistent image dimensions',
        'Maintain visual coherence across slides',
        'Ensure good contrast for text overlays',
        'Consider the story flow between slides'
      ],
      examples: [
        'Product features',
        'Customer testimonials',
        'Brand milestones',
        'Seasonal campaigns'
      ]
    },
    products: {
      sectionType: 'products',
      recommendedSizes: [
        { width: 400, height: 400, name: 'Product Grid' },
        { width: 600, height: 600, name: 'Featured Product' }
      ],
      bestPractices: [
        'Use clean, well-lit product photography',
        'Maintain consistent styling',
        'Show products from multiple angles',
        'Include lifestyle/contextual shots'
      ],
      examples: [
        'Individual product shots',
        'Product in use',
        'Detail close-ups',
        'Product comparisons'
      ]
    },
    features: {
      sectionType: 'features',
      recommendedSizes: [
        { width: 600, height: 400, name: 'Feature Image' },
        { width: 400, height: 300, name: 'Small Feature' }
      ],
      bestPractices: [
        'Use icons or simple graphics',
        'Keep imagery clean and uncluttered',
        'Ensure good contrast for text',
        'Use consistent visual style'
      ],
      examples: [
        'Quality badges',
        'Service illustrations',
        'Feature icons',
        'Abstract representations'
      ]
    },
    testimonial: {
      sectionType: 'testimonial',
      recommendedSizes: [
        { width: 200, height: 200, name: 'Profile Photo' },
        { width: 100, height: 100, name: 'Small Profile' }
      ],
      bestPractices: [
        'Use authentic customer photos',
        'Ensure good lighting and clarity',
        'Get proper permissions for usage',
        'Consider diversity and representation'
      ],
      examples: [
        'Customer portraits',
        'Product usage photos',
        'Team member photos',
        'Company culture shots'
      ]
    },
    cta: {
      sectionType: 'cta',
      recommendedSizes: [
        { width: 1200, height: 400, name: 'CTA Background' },
        { width: 800, height: 300, name: 'Mobile CTA' }
      ],
      bestPractices: [
        'Use action-oriented imagery',
        'Ensure text readability',
        'Create visual hierarchy',
        'Use brand-consistent colors'
      ],
      examples: [
        'Action shots',
        'Achievement imagery',
        'Community photos',
        'Brand lifestyle shots'
      ]
    }
  };

  generatePlaceholder(sectionType: string, dimensions: { width: number; height: number }): string {
    const { width, height } = dimensions;

    // Generate a placeholder with section-specific styling
    const backgroundColor = this.getPlaceholderColor(sectionType);
    const textColor = this.getContrastColor(backgroundColor);

    return `${this.placeholderBaseUrl}/${width}x${height}/${backgroundColor}/${textColor}?text=${encodeURIComponent(sectionType.toUpperCase())}`;
  }

  generatePlaceholdersForSections(sections: Array<{ id: string; type: string }>): PlaceholderImage[] {
    return sections.map(section => {
      const recommendation = this.imageRecommendations[section.type] || this.imageRecommendations.products;
      const primarySize = recommendation.recommendedSizes[0];

      return {
        sectionId: section.id,
        sectionType: section.type,
        placeholderUrl: this.generatePlaceholder(section.type, primarySize),
        recommendedSize: primarySize,
        altText: `${section.type} placeholder image`,
        category: this.getSectionCategory(section.type),
        tags: this.getSectionTags(section.type)
      };
    });
  }

  generateBrandSpecificPlaceholders(brandId: string, sections: Array<{ id: string; type: string }>): PlaceholderImage[] {
    // In a real implementation, this would consider brand colors, style, and previous imagery
    return this.generatePlaceholdersForSections(sections).map(placeholder => ({
      ...placeholder,
      placeholderUrl: placeholder.placeholderUrl + `&brand=${brandId}`,
      altText: `${placeholder.altText} for brand ${brandId}`
    }));
  }

  getImageRecommendations(sectionType: string): ImageRecommendation {
    return this.imageRecommendations[sectionType] || this.imageRecommendations.products;
  }

  getPlaceholderCategories() {
    return this.placeholderCategories;
  }

  // Helper methods
  private getPlaceholderColor(sectionType: string): string {
    const colors: Record<string, string> = {
      hero: '2563eb',      // Blue
      carousel: '7c3aed',  // Purple
      products: '059669',  // Emerald
      features: 'dc2626',  // Red
      testimonial: 'ea580c', // Orange
      cta: '7c2d12'       // Stone
    };

    return colors[sectionType] || '6b7280'; // Default gray
  }

  private getContrastColor(backgroundColor: string): string {
    // Simple contrast calculation - in production, use a proper contrast library
    return 'ffffff'; // White text for all placeholders
  }

  private getSectionCategory(sectionType: string): string {
    const categories: Record<string, string> = {
      hero: 'lifestyle',
      carousel: 'products',
      products: 'products',
      features: 'abstract',
      testimonial: 'lifestyle',
      cta: 'lifestyle'
    };

    return categories[sectionType] || 'products';
  }

  private getSectionTags(sectionType: string): string[] {
    const tags: Record<string, string[]> = {
      hero: ['hero', 'main', 'featured', 'brand'],
      carousel: ['carousel', 'slider', 'featured', 'products'],
      products: ['products', 'catalog', 'grid', 'shop'],
      features: ['features', 'benefits', 'icons', 'abstract'],
      testimonial: ['testimonial', 'review', 'customer', 'social-proof'],
      cta: ['cta', 'action', 'conversion', 'button']
    };

    return tags[sectionType] || ['general'];
  }

  // Generate Unsplash URLs for realistic placeholders
  generateUnsplashPlaceholder(category: string, dimensions: { width: number; height: number }): string {
    const { width, height } = dimensions;

    // Unsplash photo IDs for different categories
    const categoryPhotos: Record<string, string[]> = {
      fashion: ['1606744046267-8855f9e652e2', '1601762603339-bbf0e6d7c0d9', '1604176352284-08fb46b2bc2c'],
      products: ['1542291026-7eec264c27ff', '1505740420928-5e1c80e6208c', '1545558014-8692077e9b5c'],
      lifestyle: ['1558618666-fcd25c85cd64', '1521737604896-d14cc237f56d', '1507003211169-0a1dd7228f2d'],
      abstract: ['1506905925346-21bda4d32df4', '1518837695005-2083093ee35b', '1506905925346-21bda4d32df4'],
      nature: ['1506905925346-21bda4d32df4', '1518837695005-2083093ee35b', '1501594907352-04cda38ebc29']
    };

    const photos = categoryPhotos[category] || categoryPhotos.products;
    const randomPhoto = photos[Math.floor(Math.random() * photos.length)];

    return `${this.unsplashBaseUrl}-${randomPhoto}?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=${width}&h=${height}&q=80`;
  }

  // Generate placeholder with brand colors
  generateBrandColoredPlaceholder(
    sectionType: string,
    dimensions: { width: number; height: number },
    brandColors: { primary: string; secondary?: string }
  ): string {
    const { width, height } = dimensions;
    const primaryColor = brandColors.primary.replace('#', '');

    return `${this.placeholderBaseUrl}/${width}x${height}/${primaryColor}/ffffff?text=${encodeURIComponent(sectionType.toUpperCase())}`;
  }

  // Get placeholder suggestions based on brand and section
  getPlaceholderSuggestions(
    brandId: string,
    sectionType: string,
    count: number = 3
  ): Array<{ url: string; description: string; source: string }> {
    const category = this.getSectionCategory(sectionType);
    const suggestions = [];

    for (let i = 0; i < count; i++) {
      suggestions.push({
        url: this.generateUnsplashPlaceholder(category, { width: 800, height: 600 }),
        description: `${sectionType} example ${i + 1}`,
        source: 'unsplash'
      });
    }

    return suggestions;
  }
}

// Factory function to create the service
export const createImagePlaceholderService = (): PlaceholderService => {
  return new ImagePlaceholderManager();
};

// Types are already exported as interfaces above