"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Upload, X, Image, ChevronLeft, ChevronRight, Check, RefreshCw, Ruler } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import ColorSelector from "@/components/admin/ColorSelector"
import SizeSelector from "@/components/admin/SizeSelector"
import { ColorOption, SizeOption, ProductVariation as VariationType } from "@/types/product-variations"
import { generateProductVariations } from "@/lib/variation-generator"

interface Brand {
  $id: string
  name: string
  prefix: string
  status: boolean
}

interface Category {
  $id: string
  name: string
  status: boolean
}

interface ProductImage {
  id: string
  url: string
  source: 'device' | 'url'
  type: 'main' | 'back' | 'sizeGuide'
}

export default function NewProductPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [brands, setBrands] = useState<Brand[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingBrands, setLoadingBrands] = useState(true)
  const [loadingCategories, setLoadingCategories] = useState(true)

  // Form data for all steps
  const [basicInfo, setBasicInfo] = useState({
    name: "",
    slug: "",
    brand_id: "",
    category_id: "",
    price: 0,
    discount_price: 0,
    units: 1,
    min_order_quantity: 1,
    description: "",
    mainImageId: "",
    mainImageUrl: "",
    backImageId: "",
    backImageUrl: "",
    sizeGuideImageId: "",
    sizeGuideImageUrl: "",
    meta_title: "",
    meta_description: "",
    meta_keywords: "",
  })

  const [productImages, setProductImages] = useState<ProductImage[]>([])
  
  // Variation state
  const [selectedColors, setSelectedColors] = useState<ColorOption[]>([])
  const [selectedSizes, setSelectedSizes] = useState<SizeOption[]>([])
  const [generatedVariations, setGeneratedVariations] = useState<VariationType[]>([])
  const [hasVariations, setHasVariations] = useState(false)

  const [statusSettings, setStatusSettings] = useState({
    is_active: true,
    is_new: true,
    is_featured: false,
  })

  const router = useRouter()

  const totalSteps = 4

  // Helper functions
  const updateBasicInfo = (field: string, value: string | number | boolean) => {
    setBasicInfo(prev => ({ ...prev, [field]: value }))
  }

  const updateStatusSettings = (field: string, value: boolean) => {
    setStatusSettings(prev => ({ ...prev, [field]: value }))
  }

  // Fetch brands and categories
  const fetchBrands = async () => {
    try {
      setLoadingBrands(true)
      const response = await fetch('/api/admin/brands?status=true')
      const data = await response.json()
      if (!data.error) {
        setBrands(data.brands || [])
      }
    } catch (error) {
      console.error("Failed to fetch brands:", error)
    } finally {
      setLoadingBrands(false)
    }
  }

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true)
      const response = await fetch('/api/admin/categories?status=true')
      const data = await response.json()
      if (!data.error) {
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error)
    } finally {
      setLoadingCategories(false)
    }
  }

  useEffect(() => {
    fetchBrands()
    fetchCategories()
  }, [])

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  // Step navigation
  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  // Validation for each step
  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        if (!basicInfo.name.trim()) {
          alert("Product name is required")
          return false
        }
        if (!basicInfo.price || basicInfo.price <= 0) {
          alert("Valid price is required")
          return false
        }
        if (!basicInfo.brand_id) {
          alert("Brand selection is required")
          return false
        }
        if (!basicInfo.category_id) {
          alert("Category selection is required")
          return false
        }
        return true
      case 2:
        // Validate main and back images
        const mainImage = productImages.find(img => img.type === 'main')
        const backImage = productImages.find(img => img.type === 'back')
        if (!mainImage || !backImage) {
          alert("Both main view and back view images are required")
          return false
        }
        
        // Validate size guide image (REQUIRED)
        const sizeGuideImage = productImages.find(img => img.type === 'sizeGuide')
        if (!sizeGuideImage) {
          alert("Size guide image is required. Please upload a size guide image for this product.")
          return false
        }
        
        return true
      case 3:
        if (selectedColors.length > 0 && selectedSizes.length === 0) {
          return confirm("You've selected colors but no sizes. The product will have color-only variations. Continue?")
        }
        if (selectedSizes.length > 0 && selectedColors.length === 0) {
          alert("If you select sizes, you must also select at least one color")
          return false
        }
        return true
      default:
        return true
    }
  }

  // Handle image upload from device
  const handleDeviceUpload = async (type: 'main' | 'back' | 'sizeGuide', file: File) => {
    try {
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file')
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB')
        return
      }

      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(2)
      const fileExtension = file.name.split('.').pop()
      const fileName = `${type}-${timestamp}-${randomId}.${fileExtension}`

      const formData = new FormData()
      formData.append('file', file)
      formData.append('fileName', fileName)
      formData.append('type', type === 'sizeGuide' ? 'size-guide' : type)

      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        const newImage: ProductImage = {
          id: `${type}-${Date.now()}`,
          url: result.url || `/uploads/images/${fileName}`,
          source: 'device',
          type
        }

        setProductImages(prev => {
          const filtered = prev.filter(img => img.type !== type)
          return [...filtered, newImage]
        })

        // Update basic info with image data
        if (type === 'main') {
          updateBasicInfo('mainImageId', `img_${Date.now()}_main`)
          updateBasicInfo('mainImageUrl', result.url || `/uploads/images/${fileName}`)
        } else if (type === 'back') {
          updateBasicInfo('backImageId', `img_${Date.now()}_back`)
          updateBasicInfo('backImageUrl', result.url || `/uploads/images/${fileName}`)
        } else if (type === 'sizeGuide') {
          updateBasicInfo('sizeGuideImageId', `img_${Date.now()}_sizeGuide`)
          updateBasicInfo('sizeGuideImageUrl', result.url || `/uploads/images/${fileName}`)
        }
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image. Please try again.')
    }
  }

  // Handle image URL input
  const handleImageUpload = (type: 'main' | 'back' | 'sizeGuide', source: 'device' | 'url', value: string) => {
    if (source === 'url' && value.trim()) {
      const newImage: ProductImage = {
        id: `${type}-${Date.now()}`,
        url: value.trim(),
        source,
        type
      }

      setProductImages(prev => {
        const filtered = prev.filter(img => img.type !== type)
        return [...filtered, newImage]
      })

      if (type === 'main') {
        updateBasicInfo('mainImageId', `img_${Date.now()}_main`)
        updateBasicInfo('mainImageUrl', value.trim())
      } else if (type === 'back') {
        updateBasicInfo('backImageId', `img_${Date.now()}_back`)
        updateBasicInfo('backImageUrl', value.trim())
      } else if (type === 'sizeGuide') {
        updateBasicInfo('sizeGuideImageId', `img_${Date.now()}_sizeGuide`)
        updateBasicInfo('sizeGuideImageUrl', value.trim())
      }
    } else if (source === 'device' && !value.trim()) {
      setProductImages(prev => prev.filter(img => img.type !== type))
      if (type === 'main') {
        updateBasicInfo('mainImageId', '')
        updateBasicInfo('mainImageUrl', '')
      } else if (type === 'back') {
        updateBasicInfo('backImageId', '')
        updateBasicInfo('backImageUrl', '')
      } else if (type === 'sizeGuide') {
        updateBasicInfo('sizeGuideImageId', '')
        updateBasicInfo('sizeGuideImageUrl', '')
      }
    }
  }

  // Handle color image upload (similar to existing)
  const handleColorDeviceUpload = async (colorId: string, type: 'mainImageUrl' | 'backImageUrl', file: File) => {
    try {
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file')
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB')
        return
      }

      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(2)
      const fileExtension = file.name.split('.').pop()
      const fileName = `color-${colorId}-${type}-${timestamp}-${randomId}.${fileExtension}`

      const formData = new FormData()
      formData.append('file', file)
      formData.append('fileName', fileName)
      formData.append('type', type)

      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        const imageUrl = result.url || `/uploads/images/${fileName}`
        
        setSelectedColors(prevColors => 
          prevColors.map(color => 
            color.id === colorId 
              ? { ...color, [type]: imageUrl }
              : color
          )
        )
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error('Error uploading color image:', error)
      alert('Failed to upload image. Please try again.')
    }
  }

  const handleColorImageUrl = (colorId: string, type: 'mainImageUrl' | 'backImageUrl', url: string) => {
    if (url.trim()) {
      setSelectedColors(prevColors => 
        prevColors.map(color => 
          color.id === colorId 
            ? { ...color, [type]: url.trim() }
            : color
        )
      )
    }
  }

  // Auto-generate variations
  useEffect(() => {
    if (selectedColors.length > 0 && selectedSizes.length > 0) {
      const tempProductId = `TEMP_${Date.now().toString(36)}`
      const variations = generateProductVariations({
        productId: tempProductId,
        productName: basicInfo.name || 'New Product',
        basePrice: basicInfo.price,
        colors: selectedColors,
        sizes: selectedSizes
      })
      setGeneratedVariations(variations)
      setHasVariations(true)
    } else {
      setGeneratedVariations([])
      setHasVariations(false)
    }
  }, [selectedColors, selectedSizes, basicInfo.price, basicInfo.name])

  // Final submission
  const handleFinalSubmit = async () => {
    if (!validateCurrentStep()) return

    setIsLoading(true)

    try {
      const slug = basicInfo.slug || generateSlug(basicInfo.name)

      const mainImage = productImages.find(img => img.type === 'main')
      const backImage = productImages.find(img => img.type === 'back')
      const sizeGuideImage = productImages.find(img => img.type === 'sizeGuide')

      if (!sizeGuideImage) {
        alert("Size guide image is required")
        setIsLoading(false)
        return
      }

      // Map generated variations to backend format
      const backendVariations = generatedVariations.map((variation) => {
        const color = selectedColors.find(c => c.id === variation.colorId)
        const size = selectedSizes.find(s => s.id === variation.sizeId)

        const variationImages: string[] = []
        if (color?.mainImageUrl) variationImages.push(color.mainImageUrl)
        if (color?.backImageUrl) variationImages.push(color.backImageUrl)

        return {
          color_name: color?.name || 'Default',
          color_hex: color?.hexCode || '#000000',
          sku: variation.sku || `${slug}-${color?.name || 'default'}-${size?.name || 'onesize'}`.toLowerCase().replace(/\s+/g, '-'),
          stock_quantity: variation.stock || 0,
          price_modifier: size?.priceModifier || 0,
          is_active: true,
          sort_order: generatedVariations.indexOf(variation),
          images: variationImages,
        }
      })

      const variationsToSend = backendVariations.length > 0
        ? backendVariations
        : selectedColors.length > 0
          ? selectedColors.map((color, index) => {
              const images: string[] = []
              if (color.mainImageUrl) images.push(color.mainImageUrl)
              if (color.backImageUrl) images.push(color.backImageUrl)

              return {
                color_name: color.name,
                color_hex: color.hexCode,
                sku: `${slug}-${color.name}-onesize`.toLowerCase().replace(/\s+/g, '-'),
                stock_quantity: 100,
                price_modifier: 0,
                is_active: true,
                sort_order: index,
                images,
              }
            })
          : []

      const productData = {
        ...basicInfo,
        ...statusSettings,
        slug,
        mainImage: mainImage?.url || '',
        backImage: backImage?.url || '',
        sizeGuideImage: sizeGuideImage?.url || '', // Add size guide image
        galleryImages: [],
        variations: variationsToSend,
      }

      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      })

      const result = await response.json()

      if (response.ok) {
        alert(`✅ Product created successfully! ${result.stats?.variations || 0} variations, ${result.stats?.images || 0} images`)
        router.push("/admin-v2/products")
      } else {
        throw new Error(result.error || 'Failed to create product')
      }
    } catch (error) {
      console.error("Error creating product:", error)
      alert(`❌ Error creating product: ${error instanceof Error ? error.message : 'Please try again.'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin-v2/products">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Add New Product</h1>
            <p className="text-muted-foreground mt-1">
              Create a new product for your catalog
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchCategories()
              fetchBrands()
            }}
            disabled={loadingCategories || loadingBrands}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loadingCategories || loadingBrands ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className={currentStep >= 1 ? "text-primary font-medium" : "text-muted-foreground"}>
                Step 1: Basic Information
              </span>
              <span className={currentStep >= 2 ? "text-primary font-medium" : "text-muted-foreground"}>
                Step 2: Product Images & Size Guide
              </span>
              <span className={currentStep >= 3 ? "text-primary font-medium" : "text-muted-foreground"}>
                Step 3: Variations
              </span>
              <span className={currentStep >= 4 ? "text-primary font-medium" : "text-muted-foreground"}>
                Step 4: Review
              </span>
            </div>
            <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <div className="min-h-[600px]">
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>
                    Essential product details and description
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      placeholder="Premium Cotton T-Shirt"
                      value={basicInfo.name}
                      onChange={(e) => {
                        updateBasicInfo("name", e.target.value)
                        updateBasicInfo("slug", generateSlug(e.target.value))
                      }}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">URL Slug</Label>
                    <Input
                      id="slug"
                      placeholder="premium-cotton-t-shirt"
                      value={basicInfo.slug}
                      onChange={(e) => updateBasicInfo("slug", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Auto-generated from product name
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Detailed product description..."
                      className="min-h-32"
                      value={basicInfo.description}
                      onChange={(e) => updateBasicInfo("description", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meta_title">Meta Title (SEO)</Label>
                    <Input
                      id="meta_title"
                      placeholder="Premium Cotton T-Shirt - Best Quality"
                      value={basicInfo.meta_title}
                      onChange={(e) => updateBasicInfo("meta_title", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meta_description">Meta Description (SEO)</Label>
                    <Textarea
                      id="meta_description"
                      placeholder="High-quality premium cotton t-shirt..."
                      className="min-h-20"
                      value={basicInfo.meta_description}
                      onChange={(e) => updateBasicInfo("meta_description", e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pricing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      placeholder="29.99"
                      value={basicInfo.price || ""}
                      onChange={(e) => updateBasicInfo("price", parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discount_price">Discount Price</Label>
                    <Input
                      id="discount_price"
                      type="number"
                      step="0.01"
                      placeholder="24.99"
                      value={basicInfo.discount_price || ""}
                      onChange={(e) => updateBasicInfo("discount_price", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Product Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand_id">Brand *</Label>
                    <Select value={basicInfo.brand_id} onValueChange={(value) => updateBasicInfo("brand_id", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingBrands ? "Loading brands..." : "Select a brand"} />
                      </SelectTrigger>
                      <SelectContent>
                        {brands.map((brand) => (
                          <SelectItem key={brand.$id} value={brand.$id}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category_id">Category *</Label>
                    <Select value={basicInfo.category_id} onValueChange={(value) => updateBasicInfo("category_id", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingCategories ? "Loading categories..." : "Select a category"} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.$id} value={category.$id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="units">Units</Label>
                    <Input
                      id="units"
                      type="number"
                      placeholder="50"
                      value={basicInfo.units}
                      onChange={(e) => updateBasicInfo("units", parseInt(e.target.value) || 0)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Step 2: Product Images & Size Guide */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <Alert>
              <Ruler className="h-4 w-4" />
              <AlertDescription>
                <strong>Size Guide Required:</strong> You must upload a size guide image for this product. This helps customers choose the right size.
              </AlertDescription>
            </Alert>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Main Image */}
              <Card>
                <CardHeader>
                  <CardTitle>Main View Image *</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {productImages.find(img => img.type === 'main') ? (
                      <div className="space-y-4">
                        <img
                          src={productImages.find(img => img.type === 'main')?.url}
                          alt="Main view"
                          className="max-h-48 mx-auto rounded"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleImageUpload('main', 'device', '')}
                        >
                          Change Image
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Image className="h-12 w-12 mx-auto text-gray-400" />
                        <div className="space-y-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleDeviceUpload('main', file)
                            }}
                            className="hidden"
                            id="main-image-upload"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById('main-image-upload')?.click()}
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Upload from Device
                          </Button>
                          <p className="text-sm text-gray-500">or</p>
                          <Input
                            placeholder="Enter image URL"
                            onChange={(e) => handleImageUpload('main', 'url', e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Back Image */}
              <Card>
                <CardHeader>
                  <CardTitle>Back View Image *</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {productImages.find(img => img.type === 'back') ? (
                      <div className="space-y-4">
                        <img
                          src={productImages.find(img => img.type === 'back')?.url}
                          alt="Back view"
                          className="max-h-48 mx-auto rounded"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleImageUpload('back', 'device', '')}
                        >
                          Change Image
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Image className="h-12 w-12 mx-auto text-gray-400" />
                        <div className="space-y-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleDeviceUpload('back', file)
                            }}
                            className="hidden"
                            id="back-image-upload"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById('back-image-upload')?.click()}
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Upload from Device
                          </Button>
                          <p className="text-sm text-gray-500">or</p>
                          <Input
                            placeholder="Enter image URL"
                            onChange={(e) => handleImageUpload('back', 'url', e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Size Guide Image - REQUIRED */}
            <Card className="border-2 border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ruler className="h-5 w-5 text-primary" />
                  Size Guide Image *
                  <Badge variant="destructive" className="ml-2">Required</Badge>
                </CardTitle>
                <CardDescription>
                  Upload a size guide image to help customers choose the right size. This is required for all products.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-primary rounded-lg p-6 text-center bg-primary/5">
                  {productImages.find(img => img.type === 'sizeGuide') ? (
                    <div className="space-y-4">
                      <img
                        src={productImages.find(img => img.type === 'sizeGuide')?.url}
                        alt="Size guide"
                        className="max-h-64 mx-auto rounded border-2 border-primary"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleImageUpload('sizeGuide', 'device', '')}
                      >
                        Change Size Guide
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Ruler className="h-16 w-16 mx-auto text-primary" />
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-primary">Size guide image is required</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleDeviceUpload('sizeGuide', file)
                          }}
                          className="hidden"
                          id="size-guide-upload"
                        />
                        <Button
                          onClick={() => document.getElementById('size-guide-upload')?.click()}
                          className="bg-primary hover:bg-primary/90"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Size Guide
                        </Button>
                        <p className="text-sm text-gray-500">or</p>
                        <Input
                          placeholder="Enter size guide image URL"
                          onChange={(e) => handleImageUpload('sizeGuide', 'url', e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Variations (same as before) */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Color Variations</CardTitle>
                <CardDescription>
                  Select colors and upload images for each color (optional)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ColorSelector
                  selectedColors={selectedColors}
                  onColorsChange={setSelectedColors}
                  maxColors={10}
                />
              </CardContent>
            </Card>

            {selectedColors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Color Images</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {selectedColors.map((color) => (
                      <div key={color.id} className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-center gap-3 mb-4">
                          <div 
                            className="w-8 h-8 rounded-full border-2 border-gray-300" 
                            style={{ backgroundColor: color.hexCode }}
                          />
                          <h3 className="font-semibold text-lg">{color.name}</h3>
                        </div>
                        
                        <div className="grid gap-6 md:grid-cols-2">
                          <div className="space-y-4">
                            <Label>Front View Image</Label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                              {color.mainImageUrl ? (
                                <div className="space-y-4">
                                  <img src={color.mainImageUrl} alt={`${color.name} front`} className="max-h-48 mx-auto rounded" />
                                  <Button variant="outline" size="sm" onClick={() => {
                                    setSelectedColors(prevColors => 
                                      prevColors.map(c => c.id === color.id ? { ...c, mainImageUrl: '' } : c)
                                    )
                                  }}>
                                    Change Image
                                  </Button>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  <Image className="h-12 w-12 mx-auto text-gray-400" />
                                  <div className="space-y-2">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) handleColorDeviceUpload(color.id, 'mainImageUrl', file)
                                      }}
                                      className="hidden"
                                      id={`color-${color.id}-main-upload`}
                                    />
                                    <Button variant="outline" size="sm" onClick={() => document.getElementById(`color-${color.id}-main-upload`)?.click()}>
                                      <Upload className="mr-2 h-4 w-4" />
                                      Upload
                                    </Button>
                                    <Input placeholder="Or enter URL" onChange={(e) => handleColorImageUrl(color.id, 'mainImageUrl', e.target.value)} />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <Label>Back View Image</Label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                              {color.backImageUrl ? (
                                <div className="space-y-4">
                                  <img src={color.backImageUrl} alt={`${color.name} back`} className="max-h-48 mx-auto rounded" />
                                  <Button variant="outline" size="sm" onClick={() => {
                                    setSelectedColors(prevColors => 
                                      prevColors.map(c => c.id === color.id ? { ...c, backImageUrl: '' } : c)
                                    )
                                  }}>
                                    Change Image
                                  </Button>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  <Image className="h-12 w-12 mx-auto text-gray-400" />
                                  <div className="space-y-2">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) handleColorDeviceUpload(color.id, 'backImageUrl', file)
                                      }}
                                      className="hidden"
                                      id={`color-${color.id}-back-upload`}
                                    />
                                    <Button variant="outline" size="sm" onClick={() => document.getElementById(`color-${color.id}-back-upload`)?.click()}>
                                      <Upload className="mr-2 h-4 w-4" />
                                      Upload
                                    </Button>
                                    <Input placeholder="Or enter URL" onChange={(e) => handleColorImageUrl(color.id, 'backImageUrl', e.target.value)} />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Size Variations</CardTitle>
                <CardDescription>
                  Select sizes and configure stock & pricing (optional)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SizeSelector
                  selectedSizes={selectedSizes}
                  onSizesChange={setSelectedSizes}
                  maxSizes={15}
                />
              </CardContent>
            </Card>

            {generatedVariations.length > 0 && (
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-900">Auto-Generated Variations</CardTitle>
                  <CardDescription className="text-blue-800">
                    {generatedVariations.length} variations will be created
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {generatedVariations.slice(0, 10).map((variation) => {
                      const color = selectedColors.find(c => c.id === variation.colorId)
                      const size = selectedSizes.find(s => s.id === variation.sizeId)
                      return (
                        <div key={variation.id} className="flex items-center justify-between p-2 bg-white rounded border">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full border-2" style={{ backgroundColor: color?.hexCode }} />
                            <span className="text-sm font-medium">{color?.name} - {size?.name}</span>
                          </div>
                          <div className="flex gap-4 text-xs text-gray-600">
                            <span>Stock: {variation.stock}</span>
                            <span>Price: ${variation.price?.toFixed(2)}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Step 4: Review */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={statusSettings.is_active}
                    onCheckedChange={(checked) => updateStatusSettings("is_active", checked)}
                  />
                  <Label htmlFor="is_active">Product is active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_new"
                    checked={statusSettings.is_new}
                    onCheckedChange={(checked) => updateStatusSettings("is_new", checked)}
                  />
                  <Label htmlFor="is_new">Mark as new product</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_featured"
                    checked={statusSettings.is_featured}
                    onCheckedChange={(checked) => updateStatusSettings("is_featured", checked)}
                  />
                  <Label htmlFor="is_featured">Featured product</Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Review Product</CardTitle>
                <CardDescription>
                  Verify all information before creating the product
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm mb-2">Basic Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name:</span>
                      <p className="font-medium">{basicInfo.name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Price:</span>
                      <p className="font-medium">${basicInfo.price}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium text-sm mb-2">Images</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <span className="text-muted-foreground text-sm">Main Image:</span>
                      {basicInfo.mainImageUrl ? (
                        <img src={basicInfo.mainImageUrl} alt="Main" className="w-24 h-24 object-cover rounded mt-1" />
                      ) : (
                        <p className="text-sm text-destructive">Not uploaded</p>
                      )}
                    </div>
                    <div>
                      <span className="text-muted-foreground text-sm">Back Image:</span>
                      {basicInfo.backImageUrl ? (
                        <img src={basicInfo.backImageUrl} alt="Back" className="w-24 h-24 object-cover rounded mt-1" />
                      ) : (
                        <p className="text-sm text-destructive">Not uploaded</p>
                      )}
                    </div>
                    <div>
                      <span className="text-muted-foreground text-sm">Size Guide:</span>
                      {basicInfo.sizeGuideImageUrl ? (
                        <img src={basicInfo.sizeGuideImageUrl} alt="Size Guide" className="w-24 h-24 object-cover rounded mt-1 border-2 border-primary" />
                      ) : (
                        <p className="text-sm text-destructive font-bold">⚠️ REQUIRED</p>
                      )}
                    </div>
                  </div>
                </div>

                {hasVariations && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium text-sm mb-2">Variations</h4>
                    <div className="flex gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Colors:</span>
                        <p className="font-medium">{selectedColors.length}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Sizes:</span>
                        <p className="font-medium">{selectedSizes.length}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Variations:</span>
                        <p className="font-medium">{generatedVariations.length}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div>
          {currentStep > 1 && (
            <Button type="button" variant="outline" onClick={prevStep}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin-v2/products">Cancel</Link>
          </Button>

          {currentStep < totalSteps ? (
            <Button type="button" onClick={nextStep}>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" onClick={handleFinalSubmit} disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Create Product
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

