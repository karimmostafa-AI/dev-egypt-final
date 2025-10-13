"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Upload, X, Image, ChevronLeft, ChevronRight, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import ColorSelector from "@/components/admin/ColorSelector"
import SizeSelector from "@/components/admin/SizeSelector"
import ColorVariationImageManager from "@/components/admin/ColorVariationImageManager"
import { ColorOption, SizeOption, ProductVariation } from "@/types/product-variations"
import { generateProductVariations, validateVariations } from "@/lib/variation-generator"

// Color palette for product variations
const colorPalette = [
  { name: 'Black', hex: '#000000', rgb: '0,0,0' },
  { name: 'White', hex: '#FFFFFF', rgb: '255,255,255' },
  { name: 'Red', hex: '#FF0000', rgb: '255,0,0' },
  { name: 'Green', hex: '#00FF00', rgb: '0,255,0' },
  { name: 'Blue', hex: '#0000FF', rgb: '0,0,255' },
  { name: 'Yellow', hex: '#FFFF00', rgb: '255,255,0' },
  { name: 'Orange', hex: '#FFA500', rgb: '255,165,0' },
  { name: 'Purple', hex: '#800080', rgb: '128,0,128' },
  { name: 'Pink', hex: '#FFC0CB', rgb: '255,192,203' },
  { name: 'Gray', hex: '#808080', rgb: '128,128,128' },
  { name: 'Brown', hex: '#A52A2A', rgb: '165,42,42' },
  { name: 'Navy', hex: '#000080', rgb: '0,0,128' },
  { name: 'Teal', hex: '#008080', rgb: '0,128,128' },
  { name: 'Maroon', hex: '#800000', rgb: '128,0,0' },
  { name: 'Olive', hex: '#808000', rgb: '128,128,0' },
  { name: 'Cyan', hex: '#00FFFF', rgb: '0,255,255' },
  { name: 'Magenta', hex: '#FF00FF', rgb: '255,0,255' },
  { name: 'Silver', hex: '#C0C0C0', rgb: '192,192,192' },
  { name: 'Gold', hex: '#FFD700', rgb: '255,215,0' },
  { name: 'Beige', hex: '#F5F5DC', rgb: '245,245,220' },
]

// Size options for product variations
const sizeOptions = [
  'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL',
  'One Size', '28', '30', '32', '34', '36', '38', '40', '42', '44'
]

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

interface ProductVariation {
  id: string
  color?: string
  colorName?: string
  size?: string
  imageUrl: string
  imageSource: 'device' | 'url'
  type: 'color' | 'size' | 'both'
}

interface ProductImage {
  id: string
  url: string
  source: 'device' | 'url'
  type: 'main' | 'back'
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
  })

  const [productImages, setProductImages] = useState<ProductImage[]>([])
  const [oldProductVariations, setOldProductVariations] = useState<ProductVariation[]>([])
  
  // New variation state
  const [selectedColors, setSelectedColors] = useState<ColorOption[]>([])
  const [selectedSizes, setSelectedSizes] = useState<SizeOption[]>([])
  const [generatedVariations, setGeneratedVariations] = useState<ProductVariation[]>([])
  const [hasVariations, setHasVariations] = useState(false)

  const [statusSettings, setStatusSettings] = useState({
    is_active: true,
    is_new: true,
    is_featured: false,
  })

  const router = useRouter()

  const totalSteps = 4 // Updated to include variations step

  // Helper function to update basic info
  const updateBasicInfo = (field: string, value: string | number | boolean) => {
    setBasicInfo(prev => ({ ...prev, [field]: value }))
  }

  // Helper function to update status settings
  const updateStatusSettings = (field: string, value: boolean) => {
    setStatusSettings(prev => ({ ...prev, [field]: value }))
  }

  // Fetch brands from API
  const fetchBrands = async () => {
    try {
      setLoadingBrands(true)
      const response = await fetch('/api/admin/brands?status=true')
      const data = await response.json()
      
      if (data.error) {
        console.error("Error fetching brands:", data.error)
        return
      }

      setBrands(data.brands || [])
    } catch (error) {
      console.error("Failed to fetch brands:", error)
    } finally {
      setLoadingBrands(false)
    }
  }

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true)
      const response = await fetch('/api/admin/categories?status=true')
      const data = await response.json()
      
      if (data.error) {
        console.error("Error fetching categories:", data.error)
        return
      }

      setCategories(data.categories || [])
    } catch (error) {
      console.error("Failed to fetch categories:", error)
    } finally {
      setLoadingCategories(false)
    }
  }

  // Load brands and categories on component mount
  useEffect(() => {
    fetchBrands()
    fetchCategories()
  }, [])

  // Generate slug from name
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
        if (productImages.length < 2) {
          alert("Both main view and back view images are required")
          return false
        }
        const mainImage = productImages.find(img => img.type === 'main')
        const backImage = productImages.find(img => img.type === 'back')
        if (!mainImage || !backImage) {
          alert("Both main view and back view images are required")
          return false
        }
        return true
      case 3:
        return true // Variations are optional
      default:
        return true
    }
  }

  // Handle image upload from device
  const handleDeviceUpload = async (type: 'main' | 'back', file: File) => {
    let result: any = null
    let fileName = ''

    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file')
        return
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image size should be less than 5MB')
        return
      }

      // For local storage approach (as specified in requirements)
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(2)
      const fileExtension = file.name.split('.').pop()
      fileName = `${type}-${timestamp}-${randomId}.${fileExtension}`

      // Save to public/uploads/images directory
      const formData = new FormData()
      formData.append('file', file)
      formData.append('fileName', fileName)
      formData.append('type', type)

      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        result = await response.json()
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
  const handleImageUpload = (type: 'main' | 'back', source: 'device' | 'url', value: string) => {
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

      // Update basic info with image data
      if (type === 'main') {
        updateBasicInfo('mainImageId', `img_${Date.now()}_main`)
        updateBasicInfo('mainImageUrl', value.trim())
      } else if (type === 'back') {
        updateBasicInfo('backImageId', `img_${Date.now()}_back`)
        updateBasicInfo('backImageUrl', value.trim())
      }
    } else if (source === 'device' && !value.trim()) {
      // Clear the image when "Change Image" is clicked
      setProductImages(prev => prev.filter(img => img.type !== type))

      // Clear basic info image data
      if (type === 'main') {
        updateBasicInfo('mainImageId', '')
        updateBasicInfo('mainImageUrl', '')
      } else if (type === 'back') {
        updateBasicInfo('backImageId', '')
        updateBasicInfo('backImageUrl', '')
      }
    }
  }

  // Handle color image updates
  const handleColorImageUpdate = (colorId: string, updates: Partial<ColorOption>) => {
    setSelectedColors(prev => prev.map(color => 
      color.id === colorId ? { ...color, ...updates } : color
    ))
  }

  // Auto-generate variations when colors and sizes change
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
      console.log(`✓ Auto-generated ${variations.length} variations`)
    } else {
      setGeneratedVariations([])
      setHasVariations(false)
    }
  }, [selectedColors, selectedSizes, basicInfo.price, basicInfo.name])

  // Legacy variation management (keeping for backwards compatibility)
  const addColorVariation = (color: string, colorName: string) => {
    const newVariation: any = {
      id: `variation-${Date.now()}`,
      color,
      colorName,
      imageUrl: '',
      imageSource: 'device',
      type: 'color'
    }
    setOldProductVariations(prev => [...prev, newVariation])
  }

  const addSizeVariation = (size: string) => {
    const newVariation: any = {
      id: `variation-${Date.now()}`,
      size,
      imageUrl: '',
      imageSource: 'device',
      type: 'size'
    }
    setOldProductVariations(prev => [...prev, newVariation])
  }

  const updateVariation = (id: string, field: string, value: string) => {
    setOldProductVariations(prev => prev.map(variation =>
      variation.id === id ? { ...variation, [field]: value } : variation
    ))
  }

  const removeVariation = (id: string) => {
    setOldProductVariations(prev => prev.filter(variation => variation.id !== id))
  }

  // Final submission
  const handleFinalSubmit = async () => {
    if (!validateCurrentStep()) return

    setIsLoading(true)

    try {
      // Auto-generate slug if not provided
      const slug = basicInfo.slug || generateSlug(basicInfo.name)

      // Prepare image data for the backend
      const mainImage = productImages.find(img => img.type === 'main')
      const backImage = productImages.find(img => img.type === 'back')

      const productData = {
        ...basicInfo,
        ...statusSettings,
        slug,
        // Set main image data
        mainImageId: mainImage ? `img_${Date.now()}_main` : '',
        mainImageUrl: mainImage?.url || '',
        backImageId: backImage ? `img_${Date.now()}_back` : '',
        backImageUrl: backImage?.url || '',
        // Store images
        images: JSON.stringify(productImages),
        // Store variation data - new format with color/size options and generated variations
        selectedColors: JSON.stringify(selectedColors),
        selectedSizes: JSON.stringify(selectedSizes),
        generatedVariations: JSON.stringify(generatedVariations),
        // Legacy variations for backwards compatibility
        variations: JSON.stringify(oldProductVariations),
      }

      console.log("Creating product:", productData)

      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      })

      const result = await response.json()

      if (response.ok) {
        router.push("/admin/products")
      } else {
        throw new Error(result.error || 'Failed to create product')
      }
    } catch (error) {
      console.error("Error creating product:", error)
      alert(`Error creating product: ${error instanceof Error ? error.message : 'Please try again.'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/products">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Product</h1>
          <p className="text-muted-foreground">
            Create a new product for your catalog
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className={currentStep >= 1 ? "text-primary font-medium" : "text-muted-foreground"}>
            Step 1: Basic Information
          </span>
          <span className={currentStep >= 2 ? "text-primary font-medium" : "text-muted-foreground"}>
            Step 2: Product Images
          </span>
          <span className={currentStep >= 3 ? "text-primary font-medium" : "text-muted-foreground"}>
            Step 3: Variations & Review
          </span>
        </div>
        <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
      </div>

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
                      Auto-generated from product name, but you can customize it
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
                    <p className="text-xs text-muted-foreground">
                      Optional sale price
                    </p>
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
                            <div className="flex items-center gap-2">
                              <span>{brand.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {brand.prefix}
                              </Badge>
                            </div>
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

                  <div className="space-y-2">
                    <Label htmlFor="min_order_quantity">Minimum Order Quantity</Label>
                    <Input
                      id="min_order_quantity"
                      type="number"
                      placeholder="1"
                      value={basicInfo.min_order_quantity}
                      onChange={(e) => updateBasicInfo("min_order_quantity", parseInt(e.target.value) || 1)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Step 2: Product Images */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
              <CardDescription>
                Upload main view and back view images for your product
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Main Image */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Main View Image *</Label>
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
                </div>

                {/* Back Image */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Back View Image *</Label>
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
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Product Variations (New Enhanced Version) */}
        {currentStep === 3 && (
          <div className="space-y-6">
            {/* Color Selection */}
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

            {/* Color Images */}
            {selectedColors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Color Images</CardTitle>
                  <CardDescription>
                    Upload front and back view images for each selected color
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ColorVariationImageManager
                    colors={selectedColors}
                    onColorImageUpdate={handleColorImageUpdate}
                  />
                </CardContent>
              </Card>
            )}

            {/* Size Selection */}
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

            {/* Generated Variations Preview */}
            {generatedVariations.length > 0 && (
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-900">Auto-Generated Variations</CardTitle>
                  <CardDescription className="text-blue-800">
                    {generatedVariations.length} variations will be created ({selectedColors.length} colors × {selectedSizes.length} sizes)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {generatedVariations.slice(0, 10).map((variation) => {
                      const color = selectedColors.find(c => c.id === variation.colorId)
                      const size = selectedSizes.find(s => s.id === variation.sizeId)
                      return (
                        <div key={variation.id} className="flex items-center justify-between p-2 bg-white rounded border border-blue-200">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-6 h-6 rounded-full border-2 border-gray-300"
                              style={{ backgroundColor: color?.hexCode }}
                            />
                            <span className="text-sm font-medium">
                              {color?.name} - {size?.name}
                            </span>
                          </div>
                          <div className="flex gap-4 text-xs text-gray-600">
                            <span>Stock: {variation.stock}</span>
                            <span>Price: ${variation.price.toFixed(2)}</span>
                          </div>
                        </div>
                      )
                    })}
                    {generatedVariations.length > 10 && (
                      <p className="text-sm text-gray-600 text-center pt-2">
                        ... and {generatedVariations.length - 10} more variations
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Step 4: Review & Status */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Status</CardTitle>
                <CardDescription>
                  Configure product visibility and status
                </CardDescription>
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

            {/* Review Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Review Product</CardTitle>
                <CardDescription>
                  Verify all information before creating the product
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Basic Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Name:</span>
                      <p className="font-medium">{basicInfo.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Price:</span>
                      <p className="font-medium">${basicInfo.price}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Stock:</span>
                      <p className="font-medium">{basicInfo.units} units</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <p className="font-medium">{statusSettings.is_active ? 'Active' : 'Inactive'}</p>
                    </div>
                  </div>
                </div>

                {hasVariations && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Variations</h4>
                    <div className="flex gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Colors:</span>
                        <p className="font-medium">{selectedColors.length}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Sizes:</span>
                        <p className="font-medium">{selectedSizes.length}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Total Variations:</span>
                        <p className="font-medium">{generatedVariations.length}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Images</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-600 text-sm">Main Image:</span>
                      {basicInfo.mainImageUrl ? (
                        <img src={basicInfo.mainImageUrl} alt="Main" className="w-24 h-24 object-cover rounded mt-1" />
                      ) : (
                        <p className="text-sm text-red-600">Not uploaded</p>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm">Back Image:</span>
                      {basicInfo.backImageUrl ? (
                        <img src={basicInfo.backImageUrl} alt="Back" className="w-24 h-24 object-cover rounded mt-1" />
                      ) : (
                        <p className="text-sm text-red-600">Not uploaded</p>
                      )}
                    </div>
                  </div>
                </div>
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
            <Link href="/admin/products">Cancel</Link>
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