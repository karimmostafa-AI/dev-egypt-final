import { NextRequest, NextResponse } from "next/server"
import { Query, ID } from "node-appwrite"
import { z } from "zod"
import { createAdminClient } from "@/lib/appwrite-admin"
import { createImageMappingService } from "@/lib/image-mapping-service"
import { enhanceProductWithVariations } from "@/lib/legacy-variation-converter"
import {
  DATABASE_ID,
  PRODUCTS_COLLECTION_ID
} from "@/lib/appwrite"

// Collection IDs not exported from lib/appwrite.ts - defining locally
const VARIATIONS_COLLECTION_ID = "product_variations"
const IMAGES_COLLECTION_ID = "product_images"
const REVIEWS_COLLECTION_ID = "reviews"

// Debug logging to verify environment variables
console.log("🔧 Appwrite Configuration Debug:")
console.log("DATABASE_ID:", DATABASE_ID)
console.log("PRODUCTS_COLLECTION_ID:", PRODUCTS_COLLECTION_ID)
console.log("VARIATIONS_COLLECTION_ID:", VARIATIONS_COLLECTION_ID)
console.log("IMAGES_COLLECTION_ID:", IMAGES_COLLECTION_ID)

// Zod validation schema
const ProductSchema = z.object({
  name: z.string(),
  slug: z.string(),
  brand_id: z.string(),
  category_id: z.string(),
  price: z.number(),
  discount_price: z.number().optional(),
  min_order_quantity: z.number().optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
  is_new: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  meta_keywords: z.string().optional(),
  units: z.number().optional(),
  mainImage: z.string().optional(),
  backImage: z.string().optional(),
  sizeGuideImage: z.string().optional(),
  galleryImages: z.preprocess((val) => {
    if (typeof val === 'string') {
      try { return JSON.parse(val) } catch { return [] }
    }
    return val
  }, z.array(z.string()).optional()),

  variations: z.preprocess((val) => {
    if (typeof val === "string") {
      try {
        return JSON.parse(val)
      } catch {
        return []
      }
    }
    return val
  }, z.array(
    z.object({
      color_name: z.string(),
      color_hex: z.string(),
      sku: z.string().optional(),
      stock_quantity: z.number().optional(),
      price_modifier: z.number().optional(),
      is_active: z.boolean().optional(),
      sort_order: z.number().optional(),
      images: z.array(z.string()).optional(),
    })
  ).optional()),
})

const isDev = process.env.NODE_ENV !== "production"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const limit = parseInt(searchParams.get("limit") || "100")
    const offset = parseInt(searchParams.get("offset") || "0")
    const available = searchParams.get("available") === "true"

    console.log('🔍 Fetching products with params:', { search, limit, offset, available });

    const { databases } = await createAdminClient()

    const queries = [
      Query.limit(limit),
      Query.offset(offset),
      Query.orderDesc("$createdAt"),
    ]

    if (search) queries.push(Query.search("name", search))
    if (available) queries.push(Query.equal("is_active", true))

    console.log('📊 Database queries:', queries);

    let result: any;
    let retries = 3;
    
    // Retry logic for better reliability
    while (retries > 0) {
      try {
        result = await databases.listDocuments(
          DATABASE_ID,
          PRODUCTS_COLLECTION_ID,
          queries
        );
        break; // Success - exit retry loop
      } catch (error: any) {
        retries--;
        console.warn(`Database request failed, retries left: ${retries}`, error.message);
        
        if (retries === 0) {
          throw error; // Re-throw on final attempt
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, (4 - retries) * 1000));
      }
    }

    console.log(`✅ Found ${result.documents.length} products`);

    // Fetch variations & images in parallel
    const enhancedProducts = await Promise.all(
      result.documents.map(async (product: any) => {
        try {
          const [variations, images] = await Promise.all([
            databases
              .listDocuments(DATABASE_ID, VARIATIONS_COLLECTION_ID, [
                Query.equal("product_id", product.$id),
                Query.orderAsc("sort_order"),
              ])
              .then((res) => res.documents)
              .catch((err) => {
                console.warn(`Failed to fetch variations for product ${product.$id}:`, err);
                return [];
              }),
            databases
              .listDocuments(DATABASE_ID, IMAGES_COLLECTION_ID, [
                Query.equal("product_id", product.$id),
                Query.orderAsc("sort_order"),
              ])
              .then((res) => res.documents)
              .catch((err) => {
                console.warn(`Failed to fetch images for product ${product.$id}:`, err);
                return [];
              }),
          ])

          const imageMappingService = createImageMappingService()
          const withImages = await imageMappingService.enhanceProductWithImages(product)

          // Extract main and back images from the images array
          const mainImage = images.find((img: any) => img.image_type === 'front')
          const backImage = images.find((img: any) => img.image_type === 'back')

          return {
            ...enhanceProductWithVariations(withImages),
            variations,
            images,
            mainImageUrl: mainImage?.image_url || '',
            mainImageId: mainImage?.image_id || '',
            backImageUrl: backImage?.image_url || '',
            backImageId: backImage?.image_id || '',
          }
        } catch (error) {
          console.error(`Error enhancing product ${product.$id}:`, error);
          // Return basic product data if enhancement fails
          return {
            ...product,
            variations: [],
            images: [],
            mainImageUrl: '',
            mainImageId: '',
            backImageUrl: '',
            backImageId: '',
          };
        }
      })
    )

    return NextResponse.json({
      success: true,
      products: enhancedProducts,
      total: result.total,
    })
  } catch (error: any) {
    console.error("❌ Error fetching products:", error)
    
    // Return more detailed error information
    return NextResponse.json({ 
      success: false,
      error: error.message,
      details: error.code || 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/**
 * POST - Create product with rollback safety
 */
export async function POST(request: NextRequest) {
  const createdDocs: { id: string; collection: string }[] = []

  try {
    const rawBody = await request.text()
    if (!rawBody.trim())
      return NextResponse.json({ error: "Empty body" }, { status: 400 })

    const jsonData = JSON.parse(rawBody)
    const data = ProductSchema.parse(jsonData)

    const { databases } = await createAdminClient()

    // Create product
    const productPayload = {
      name: data.name,
      slug: data.slug,
      brand_id: data.brand_id,
      category_id: data.category_id,
      units: data.units ?? 1,
      price: data.price,
      discount_price: data.discount_price ?? 0,
      min_order_quantity: data.min_order_quantity ?? 1,
      description: data.description || "",
      is_active: data.is_active ?? true,
      is_new: data.is_new ?? false,
      is_featured: data.is_featured ?? false,
      meta_title: data.meta_title || data.name,
      meta_description: data.meta_description || "",
      meta_keywords: data.meta_keywords || "",
    }

    const product = await databases.createDocument(
      DATABASE_ID,
      PRODUCTS_COLLECTION_ID,
      ID.unique(),
      productPayload
    )
    createdDocs.push({ id: product.$id, collection: PRODUCTS_COLLECTION_ID })

    const product_id = product.$id

    // Images (main/back/sizeGuide/gallery)
    console.log('📷 Image data received:', {
      mainImage: data.mainImage ? 'present' : 'missing',
      backImage: data.backImage ? 'present' : 'missing',
      sizeGuideImage: data.sizeGuideImage ? 'present' : 'missing',
      galleryImages: data.galleryImages?.length || 0,
      variations: data.variations?.length || 0
    })
    
    const imageOps: Promise<any>[] = []
    const addImage = (payload: any) =>
      databases
        .createDocument(DATABASE_ID, IMAGES_COLLECTION_ID, ID.unique(), payload)
        .then((res) => createdDocs.push({ id: res.$id, collection: IMAGES_COLLECTION_ID }))

    if (data.mainImage)
      imageOps.push(
        addImage({
          product_id,
          variation_id: "",
          image_type: "front",
          image_url: data.mainImage,
          image_id: `img_${product_id}_front`,
          alt_text: `${data.name} front view`,
          is_primary: true,
          sort_order: 1,
        })
      )

    if (data.backImage)
      imageOps.push(
        addImage({
          product_id,
          variation_id: "",
          image_type: "back",
          image_url: data.backImage,
          image_id: `img_${product_id}_back`,
          alt_text: `${data.name} back view`,
          is_primary: false,
          sort_order: 2,
        })
      )

    // Size Guide Image (required)
    if (data.sizeGuideImage)
      imageOps.push(
        addImage({
          product_id,
          variation_id: "",
          image_type: "size_guide",
          image_url: data.sizeGuideImage,
          image_id: `img_${product_id}_size_guide`,
          alt_text: `${data.name} size guide`,
          is_primary: false,
          sort_order: 3,
        })
      )


    // Variations
    if (data.variations?.length) {
      for (const variation of data.variations) {
        const variationDoc = await databases.createDocument(
          DATABASE_ID,
          VARIATIONS_COLLECTION_ID,
          ID.unique(),
          {
            product_id,
            color_name: variation.color_name,
            color_hex: variation.color_hex,
            sku: variation.sku || "",
            stock_quantity: variation.stock_quantity || 0,
            price_modifier: variation.price_modifier || 0,
            sort_order: variation.sort_order || 0,
            is_active: variation.is_active ?? true,
          }
        )
        createdDocs.push({ id: variationDoc.$id, collection: VARIATIONS_COLLECTION_ID })

        if (variation.images?.length)
          variation.images.forEach((url: string, i: number) =>
            imageOps.push(
              addImage({
                product_id,
                variation_id: variationDoc.$id,
                image_type: "gallery",
                image_url: url,
                image_id: `img_${variationDoc.$id}_${i}`,
                alt_text: `${data.name} ${variation.color_name} image ${i + 1}`,
                is_primary: i === 0,
                sort_order: i + 1,
              })
            )
          )
      }
    }

    const imageResults = await Promise.allSettled(imageOps)
    
    // Log image insertion results
    const successfulImages = imageResults.filter(r => r.status === 'fulfilled').length
    const failedImages = imageResults.filter(r => r.status === 'rejected')
    
    console.log(`📸 Images: ${successfulImages}/${imageOps.length} inserted successfully`)
    if (failedImages.length > 0) {
      console.warn('⚠️ Failed image insertions:', failedImages.map((r: any) => r.reason?.message))
    }

    return NextResponse.json({
      success: true,
      product_id,
      message: "✅ Product created successfully",
      stats: {
        variations: data.variations?.length || 0,
        images: successfulImages
      }
    })
  } catch (error: any) {
    console.error("❌ Error creating product:", error)

    // Rollback created docs if any
    try {
      const { databases } = await createAdminClient()
      await Promise.allSettled(
        createdDocs.map((doc) => databases.deleteDocument(DATABASE_ID, doc.collection, doc.id))
      )
      if (isDev) console.warn("🧹 Rolled back partial entries.")
    } catch (rollbackErr) {
      console.error("Rollback failed:", rollbackErr)
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: error.message || "Product creation failed" }, { status: 500 })
  }
}

/**
 * DELETE - Full cascade deletion
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("productId")
    if (!productId)
      return NextResponse.json({ error: "Product ID required" }, { status: 400 })

    const { databases } = await createAdminClient()

    const [variations, images] = await Promise.all([
      databases
        .listDocuments(DATABASE_ID, VARIATIONS_COLLECTION_ID, [
          Query.equal("product_id", productId),
        ])
        .then((r) => r.documents),
      databases
        .listDocuments(DATABASE_ID, IMAGES_COLLECTION_ID, [
          Query.equal("product_id", productId),
        ])
        .then((r) => r.documents),
    ])

    await Promise.allSettled([
      ...variations.map((v) =>
        databases.deleteDocument(DATABASE_ID, VARIATIONS_COLLECTION_ID, v.$id)
      ),
      ...images.map((i) =>
        databases.deleteDocument(DATABASE_ID, IMAGES_COLLECTION_ID, i.$id)
      ),
      databases.deleteDocument(DATABASE_ID, PRODUCTS_COLLECTION_ID, productId),
    ])

    return NextResponse.json({
      success: true,
      message: "🧹 Product and all related data deleted",
    })
  } catch (error: any) {
    console.error("Error deleting product:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete product" },
      { status: 500 }
    )
  }
}
