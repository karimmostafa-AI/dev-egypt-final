import { Databases, Storage, Query } from 'appwrite';
import { DATABASE_ID, PRODUCTS_COLLECTION_ID } from '@/lib/appwrite';

// New collection IDs for the updated schema
const PRODUCT_VARIATIONS_COLLECTION_ID = 'product_variations';
const PRODUCT_IMAGES_COLLECTION_ID = 'product_images';

// Domain models (clean data structures)
export interface ProductImage {
  id: string;
  product_id: string;
  variation_id?: string;
  image_type: 'main' | 'variation' | 'gallery';
  image_url: string;
  image_id: string;
  // Additional properties for backward compatibility with ImageService
  url?: string; // Alias for image_url
  file_id?: string; // Alias for image_id
  alt_text: string;
  sort_order: number;
  is_primary: boolean;
  is_active: boolean;
}

export interface ProductVariation {
  id: string;
  product_id: string;
  variation_type: 'color' | 'size' | 'style' | 'material';
  variation_value: string;
  variation_label: string;
  stock_quantity: number;
  price_modifier: number;
  sku: string;
  image_id?: string;
  is_active: boolean;
  sort_order: number;
}

export interface ProductData {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discount_price: number;
  compareAtPrice: number;
  sku: string;
  stockQuantity: number;
  min_order_quantity: number;
  is_active: boolean;
  hasVariations: boolean;
  variations: ProductVariation[];
  images: ProductImage[];
  brand_id?: string;
  category_id?: string;
  created_at: string;
  updated_at: string;
}

// Repository interface for dependency injection and testing
export interface IProductRepository {
  findBySlug(slug: string): Promise<ProductData | null>;
  findById(id: string): Promise<ProductData | null>;
  findMany(options?: {
    limit?: number;
    offset?: number;
    category?: string;
    featured?: boolean;
    active?: boolean;
  }): Promise<{ products: ProductData[]; total: number }>;
  search(query: string, options?: { limit?: number; offset?: number }): Promise<ProductData[]>;
}

// Implementation of the product repository
export class ProductRepository implements IProductRepository {
  constructor(
    private readonly databases: Databases,
    private readonly storage: Storage
  ) {}


  async findBySlug(slug: string): Promise<ProductData | null> {
    try {
      // Fetch the main product
      const response = await this.databases.listDocuments(
        DATABASE_ID,
        PRODUCTS_COLLECTION_ID,
        [
          Query.equal('slug', slug),
          Query.equal('is_active', true),
          Query.limit(1)
        ]
      );

      if (response.documents.length === 0) {
        return null;
      }

      const productDocument = response.documents[0];

      // Fetch variations for this product
      const variations = await this.fetchProductVariations(productDocument.$id);

      // Fetch images for this product
      const images = await this.fetchProductImages(productDocument.$id);

      return this.transformDocument(productDocument, variations, images);
    } catch (error) {
      console.error('Error fetching product by slug:', error);
      throw new Error(`Failed to fetch product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findById(id: string): Promise<ProductData | null> {
    try {
      const document = await this.databases.getDocument(
        DATABASE_ID,
        PRODUCTS_COLLECTION_ID,
        id
      );

      // Fetch variations and images for this product
      const variations = await this.fetchProductVariations(document.$id);
      const images = await this.fetchProductImages(document.$id);

      return this.transformDocument(document, variations, images);
    } catch (error) {
      console.error('Error fetching product by ID:', error);
      throw new Error(`Failed to fetch product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async fetchProductVariations(productId: string): Promise<ProductVariation[]> {
    try {
      const response = await this.databases.listDocuments(
        DATABASE_ID,
        PRODUCT_VARIATIONS_COLLECTION_ID,
        [
          Query.equal('product_id', productId),
          Query.equal('is_active', true),
          Query.orderAsc('sort_order')
        ]
      );

      return response.documents.map(doc => ({
        id: doc.$id,
        product_id: doc.product_id,
        variation_type: doc.variation_type,
        variation_value: doc.variation_value,
        variation_label: doc.variation_label,
        stock_quantity: doc.stock_quantity,
        price_modifier: doc.price_modifier,
        sku: doc.sku,
        image_id: doc.image_id,
        is_active: doc.is_active,
        sort_order: doc.sort_order
      }));
    } catch (error) {
      console.warn('Error fetching product variations:', error);
      return [];
    }
  }

  private async fetchProductImages(productId: string): Promise<ProductImage[]> {
    try {
      const response = await this.databases.listDocuments(
        DATABASE_ID,
        PRODUCT_IMAGES_COLLECTION_ID,
        [
          Query.equal('product_id', productId),
          Query.equal('is_active', true),
          Query.orderAsc('sort_order')
        ]
      );

      return response.documents.map(doc => ({
        id: doc.$id,
        product_id: doc.product_id,
        image_type: doc.image_type,
        variation_id: doc.variation_id,
        image_url: doc.image_url,
        image_id: doc.image_id,
        // Set backward compatibility properties
        url: doc.image_url,
        file_id: doc.image_id,
        alt_text: doc.alt_text,
        sort_order: doc.sort_order,
        is_primary: doc.is_primary,
        is_active: doc.is_active
      }));
    } catch (error) {
      console.warn('Error fetching product images:', error);
      return [];
    }
  }

  async findMany(options: {
    limit?: number;
    offset?: number;
    category?: string;
    featured?: boolean;
    active?: boolean;
  } = {}): Promise<{ products: ProductData[]; total: number }> {
    try {
      const queries: string[] = [];

      if (options.category) {
        queries.push(Query.equal('category_id', options.category));
      }

      if (options.featured) {
        queries.push(Query.equal('is_featured', true));
      }

      if (options.active !== false) {
        queries.push(Query.equal('is_active', true));
      }

      if (options.limit) {
        queries.push(Query.limit(options.limit));
      }

      if (options.offset) {
        queries.push(Query.offset(options.offset));
      }

      const response = await this.databases.listDocuments(
        DATABASE_ID,
        PRODUCTS_COLLECTION_ID,
        queries
      );

      const products = await Promise.all(
        response.documents.map(async (doc) => {
          const variations = await this.fetchProductVariations(doc.$id);
          const images = await this.fetchProductImages(doc.$id);
          return this.transformDocument(doc, variations, images);
        })
      );

      return {
        products,
        total: response.total
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      throw new Error(`Failed to fetch products: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async search(query: string, options: { limit?: number; offset?: number } = {}): Promise<ProductData[]> {
    try {
      const queries: string[] = [Query.search('name', query)];

      if (options.limit) {
        queries.push(Query.limit(options.limit));
      }

      if (options.offset) {
        queries.push(Query.offset(options.offset));
      }

      const response = await this.databases.listDocuments(
        DATABASE_ID,
        PRODUCTS_COLLECTION_ID,
        queries
      );

      return await Promise.all(
        response.documents.map(async (doc) => {
          const variations = await this.fetchProductVariations(doc.$id);
          const images = await this.fetchProductImages(doc.$id);
          return this.transformDocument(doc, variations, images);
        })
      );
    } catch (error) {
      console.error('Error searching products:', error);
      throw new Error(`Failed to search products: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private transformDocument(document: any, fetchedVariations: ProductVariation[] = [], fetchedImages: ProductImage[] = []): ProductData {
    // Parse JSON fields
    let variations: ProductVariation[] = [];
    let images: ProductImage[] = [];

    // Use fetched data if provided, otherwise parse from document
    if (fetchedVariations.length > 0) {
      variations = fetchedVariations;
    }

    if (fetchedImages.length > 0) {
      images = fetchedImages;
    }

    // Handle variations - check multiple possible field names
    try {
      let variationsData: any = null;
      
      if (document.variations && typeof document.variations === 'string') {
        variationsData = JSON.parse(document.variations);
      } else if (document.variations) {
        variationsData = document.variations;
      }

      // Check if variationsData is a compact summary object
      const isCompactSummary = 
        variationsData && 
        typeof variationsData === 'object' && 
        !Array.isArray(variationsData) && 
        variationsData.count !== undefined;

      if (isCompactSummary) {
        // Compact summary format - expand it using colorOptions and sizeOptions
        let colorOptions: any[] = [];
        let sizeOptions: any[] = [];

        // Parse colorOptions (may be compact format with shortened keys)
        if (document.colorOptions) {
          const parsed = typeof document.colorOptions === 'string' 
            ? JSON.parse(document.colorOptions) 
            : document.colorOptions;
          
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Check if compact format (has 'i' instead of 'id')
            if (parsed[0].i) {
              colorOptions = parsed.map((c: any) => ({
                id: c.i,
                name: c.n,
                hexCode: c.h,
                frontImageUrl: c.f,
                backImageUrl: c.b
              }));
            } else {
              colorOptions = parsed;
            }
          }
        }

        // Parse sizeOptions (may be compact format with shortened keys)
        if (document.sizeOptions) {
          const parsed = typeof document.sizeOptions === 'string' 
            ? JSON.parse(document.sizeOptions) 
            : document.sizeOptions;
          
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Check if compact format (has 'i' instead of 'id')
            if (parsed[0].i) {
              sizeOptions = parsed.map((s: any) => ({
                id: s.i,
                name: s.n,
                stock: s.s,
                priceModifier: s.p
              }));
            } else {
              sizeOptions = parsed;
            }
          }
        }

        // Generate all variation combinations
        if (colorOptions.length > 0 && sizeOptions.length > 0) {
          let varIndex = 0;
          colorOptions.forEach((color: any) => {
            sizeOptions.forEach((size: any) => {
              variations.push({
                id: `${color.id}-${size.id}`,
                product_id: document.$id,
                variation_type: 'both' as any,
                variation_value: `${color.name}-${size.name}`,
                variation_label: `${color.name} / ${size.name}`,
                stock_quantity: size.stock || 0,
                price_modifier: size.priceModifier || 0,
                sku: `${document.sku || 'SKU'}-${color.id}-${size.id}`,
                is_active: true,
                sort_order: varIndex++
              });
            });
          });
        } else if (colorOptions.length > 0) {
          colorOptions.forEach((color: any, index: number) => {
            variations.push({
              id: color.id,
              product_id: document.$id,
              variation_type: 'color',
              variation_value: color.name,
              variation_label: color.name,
              stock_quantity: document.stockQuantity || 0,
              price_modifier: 0,
              sku: `${document.sku || 'SKU'}-${color.id}`,
              is_active: true,
              sort_order: index
            });
          });
        } else if (sizeOptions.length > 0) {
          sizeOptions.forEach((size: any, index: number) => {
            variations.push({
              id: size.id,
              product_id: document.$id,
              variation_type: 'size',
              variation_value: size.name,
              variation_label: size.name,
              stock_quantity: size.stock || 0,
              price_modifier: size.priceModifier || 0,
              sku: `${document.sku || 'SKU'}-${size.id}`,
              is_active: true,
              sort_order: index
            });
          });
        }
      } else if (Array.isArray(variationsData)) {
        // Already an array format
        variations = variationsData;
      } else if (document.colorOptions || document.sizeOptions) {
        // Handle legacy format with colorOptions and sizeOptions as simple arrays
        const colorOptions = document.colorOptions ? JSON.parse(document.colorOptions) : [];
        const sizeOptions = document.sizeOptions ? JSON.parse(document.sizeOptions) : [];

        variations = [
          ...colorOptions.map((color: string, index: number) => ({
            id: `color-${index}`,
            product_id: document.$id,
            variation_type: 'color',
            variation_value: color,
            variation_label: color,
            stock_quantity: 10,
            price_modifier: 0,
            sku: '',
            is_active: true,
            sort_order: index
          })),
          ...sizeOptions.map((size: string, index: number) => ({
            id: `size-${index}`,
            product_id: document.$id,
            variation_type: 'size',
            variation_value: size,
            variation_label: size,
            stock_quantity: 10,
            price_modifier: 0,
            sku: '',
            is_active: true,
            sort_order: index
          }))
        ];
      }
    } catch (parseError) {
      console.warn('Error parsing variations:', parseError);
      variations = [];
    }

    // Handle images - check multiple possible field names and structures
    try {
      if (document.images && typeof document.images === 'string') {
        images = JSON.parse(document.images);
      } else if (Array.isArray(document.images)) {
        images = document.images;
      } else if (document.mainImageId || document.backImageId) {
        // Create images from the available image data
        const imageIndex = 0;

        if (document.mainImageUrl) {
          // Use the actual URL from the database
          const mainImageUrl = document.mainImageUrl.replace('/view', '');
          console.log(`🖼️ Creating main image:`, { url: mainImageUrl });

          images.push({
            id: `img_${imageIndex}`,
            product_id: document.$id,
            image_type: 'main',
            image_url: mainImageUrl,
            image_id: document.mainImageId || `main_${document.$id}`,
            // Set backward compatibility properties
            url: mainImageUrl,
            file_id: document.mainImageId || `main_${document.$id}`,
            alt_text: `${document.name} - Main Image`,
            sort_order: 0,
            is_primary: true,
            is_active: true
          });
        }

        if (document.backImageUrl) {
          // Use the actual URL from the database
          const backImageUrl = document.backImageUrl.replace('/view', '');
          console.log(`🖼️ Creating back image:`, { url: backImageUrl });

          images.push({
            id: `img_${imageIndex + 1}`,
            product_id: document.$id,
            image_type: 'gallery',
            image_url: backImageUrl,
            image_id: document.backImageId || `back_${document.$id}`,
            // Set backward compatibility properties
            url: backImageUrl,
            file_id: document.backImageId || `back_${document.$id}`,
            alt_text: `${document.name} - Back Image`,
            sort_order: 1,
            is_primary: false,
            is_active: true
          });
        }
      }
    } catch (parseError) {
      console.warn('Error parsing images:', parseError);
      images = [];
    }

    return {
      id: document.$id,
      name: document.name,
      slug: document.slug,
      description: document.description,
      price: document.price || document.discount_price || 0,
      discount_price: document.discount_price,
      compareAtPrice: document.compareAtPrice || document.price || 0,
      sku: document.sku || '',
      stockQuantity: document.stockQuantity || document.stock_quantity || 0,
      min_order_quantity: document.min_order_quantity || 1,
      is_active: document.is_active !== false,
      hasVariations: document.hasVariations || variations.length > 0,
      variations,
      images,
      brand_id: document.brand_id,
      category_id: document.category_id,
      created_at: document.$createdAt,
      updated_at: document.$updatedAt
    };
  }
}

// Factory function for creating repository instances
export const createProductRepository = (
  databases: Databases,
  storage: Storage
): IProductRepository => {
  return new ProductRepository(databases, storage);
};