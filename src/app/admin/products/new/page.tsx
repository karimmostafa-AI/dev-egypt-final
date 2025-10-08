"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Upload, X, Image } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

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

export default function NewProductPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [brands, setBrands] = useState<Brand[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingBrands, setLoadingBrands] = useState(true)
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    media_id: "",
    brand_id: "",
    category_id: "",
    units: 1,
    price: 0,
    discount_price: 0,
    min_order_quantity: 1,
    description: "",
    is_active: true,
    is_new: true,
    is_featured: false,
    meta_title: "",
    meta_description: "",
    meta_keywords: "",
  })
  const router = useRouter()

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.price || !formData.brand_id || !formData.category_id) {
      alert("Please fill in all required fields: Name, Price, Brand ID, and Category ID")
      return
    }

    setIsLoading(true)

    try {
      // Auto-generate slug if not provided
      const slug = formData.slug || generateSlug(formData.name)
      
      const productData = {
        ...formData,
        slug: slug
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
        // Success! Redirect to products list
        router.push("/admin/products")
      } else {
        // Handle error
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

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
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
                    value={formData.name}
                    onChange={(e) => {
                      handleInputChange("name", e.target.value)
                      // Auto-generate slug
                      handleInputChange("slug", generateSlug(e.target.value))
                    }}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input
                    id="slug"
                    placeholder="premium-cotton-t-shirt"
                    value={formData.slug}
                    onChange={(e) => handleInputChange("slug", e.target.value)}
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
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="media_id">Product Image</Label>
                  <div className="space-y-2">
                    <Input
                      id="media_id"
                      placeholder="Enter image ID from Appwrite storage or image URL"
                      value={formData.media_id}
                      onChange={(e) => handleInputChange("media_id", e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="sm">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Image
                      </Button>
                      <span className="text-xs text-muted-foreground">or enter image ID/URL above</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Upload an image to Appwrite storage or enter the image ID/URL
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meta_title">Meta Title</Label>
                  <Input
                    id="meta_title"
                    placeholder="SEO title for the product"
                    value={formData.meta_title}
                    onChange={(e) => handleInputChange("meta_title", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meta_description">Meta Description</Label>
                  <Textarea
                    id="meta_description"
                    placeholder="SEO description for the product..."
                    className="min-h-20"
                    value={formData.meta_description}
                    onChange={(e) => handleInputChange("meta_description", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meta_keywords">Meta Keywords</Label>
                  <Input
                    id="meta_keywords"
                    placeholder="demo amplus facere"
                    value={formData.meta_keywords}
                    onChange={(e) => handleInputChange("meta_keywords", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    SEO keywords for the product
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing */}
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
                    value={formData.price || ""}
                    onChange={(e) => handleInputChange("price", parseFloat(e.target.value) || 0)}
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
                    value={formData.discount_price || ""}
                    onChange={(e) => handleInputChange("discount_price", parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional sale price
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Product Details */}
            <Card>
              <CardHeader>
                <CardTitle>Product Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="brand_id">Brand *</Label>
                  <Select value={formData.brand_id} onValueChange={(value) => handleInputChange("brand_id", value)}>
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
                  <p className="text-xs text-muted-foreground">
                    Choose the brand for this product
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category_id">Category *</Label>
                  <Select value={formData.category_id} onValueChange={(value) => handleInputChange("category_id", value)}>
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
                  <p className="text-xs text-muted-foreground">
                    Choose the category for this product
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="units">Units</Label>
                  <Input
                    id="units"
                    type="number"
                    placeholder="50"
                    value={formData.units}
                    onChange={(e) => handleInputChange("units", parseInt(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of units available
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min_order_quantity">Minimum Order Quantity</Label>
                  <Input
                    id="min_order_quantity"
                    type="number"
                    placeholder="1"
                    value={formData.min_order_quantity}
                    onChange={(e) => handleInputChange("min_order_quantity", parseInt(e.target.value) || 1)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum quantity that can be ordered
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Product Status */}
            <Card>
              <CardHeader>
                <CardTitle>Product Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => handleInputChange("is_active", checked)}
                  />
                  <Label htmlFor="is_active">
                    Product is active
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_new"
                    checked={formData.is_new}
                    onCheckedChange={(checked) => handleInputChange("is_new", checked)}
                  />
                  <Label htmlFor="is_new">
                    Mark as new product
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_featured"
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => handleInputChange("is_featured", checked)}
                  />
                  <Label htmlFor="is_featured">
                    Featured product
                  </Label>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/products">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Creating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Product
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}