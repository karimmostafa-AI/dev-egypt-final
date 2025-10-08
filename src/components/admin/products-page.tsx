"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Search, UserPlus, MoreHorizontal, Trash2, Eye, Package, Plus, Edit, DollarSign, ShoppingCart, AlertTriangle, Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Product, ProductStats } from "@/types/product"

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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [availableFilter, setAvailableFilter] = useState("all")
  const [catalogFilter, setCatalogFilter] = useState("all")
  const [brandFilter, setBrandFilter] = useState("all")
  const [stats, setStats] = useState<ProductStats>({
    total: 0,
    available: 0,
    unavailable: 0,
    onSale: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<string | null>(null)
  const [uniqueCatalogs, setUniqueCatalogs] = useState<string[]>([])
  const [uniqueBrands, setUniqueBrands] = useState<string[]>([])

  // Fetch brands
  const fetchBrands = async () => {
    try {
      const response = await fetch('/api/admin/brands?status=true')
      const data = await response.json()
      
      if (data.error) {
        console.error("Error fetching brands:", data.error)
        return
      }

      setBrands(data.brands || [])
    } catch (error) {
      console.error("Failed to fetch brands:", error)
    }
  }

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories?status=true')
      const data = await response.json()
      
      if (data.error) {
        console.error("Error fetching categories:", data.error)
        return
      }

      setCategories(data.categories || [])
    } catch (error) {
      console.error("Failed to fetch categories:", error)
    }
  }

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true)
      
      // Build query parameters
      const params = new URLSearchParams({
        search: searchTerm,
        limit: "100"
      })
      
      if (availableFilter !== "all") {
        params.append("available", availableFilter)
      }
      if (catalogFilter !== "all") {
        params.append("catalog", catalogFilter)
      }
      if (brandFilter !== "all") {
        params.append("brand", brandFilter)
      }

      const response = await fetch(`/api/admin/products?${params.toString()}`)
      const data = await response.json()
      
      if (data.error) {
        console.error("Error:", data.error)
        return
      }

      setProducts(data.products || [])
      setStats(data.stats || stats)
      
      // Extract unique values for filters
      const catalogs = [...new Set(data.products?.map((p: Product) => p.category_id).filter(Boolean))] as string[]
      const brandIds = [...new Set(data.products?.map((p: Product) => p.brand_id).filter(Boolean))] as string[]
      setUniqueCatalogs(catalogs)
      setUniqueBrands(brandIds)

    } catch (error) {
      console.error("Failed to fetch products:", error)
    } finally {
      setLoading(false)
    }
  }

  // Helper functions to get brand and category names
  const getBrandPrefix = (brandId: string) => {
    const brand = brands.find(b => b.$id === brandId)
    return brand ? brand.prefix : brandId
  }

  const getBrandName = (brandId: string) => {
    const brand = brands.find(b => b.$id === brandId)
    return brand ? brand.name : brandId
  }

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.$id === categoryId)
    return category ? category.name : categoryId
  }

  // Delete product
  const handleDelete = async () => {
    if (!productToDelete) return

    try {
      const response = await fetch(
        `/api/admin/products?productId=${productToDelete}`,
        { method: "DELETE" }
      )
      
      if (response.ok) {
        fetchProducts()
        setDeleteDialogOpen(false)
        setProductToDelete(null)
      }
    } catch (error) {
      console.error("Failed to delete product:", error)
    }
  }

  // Toggle product availability
  const toggleAvailability = async (productId: string, currentAvailability: boolean) => {
    try {
      const response = await fetch(`/api/admin/products?productId=${productId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_active: !currentAvailability }),
      })
      
      if (response.ok) {
        fetchProducts()
      }
    } catch (error) {
      console.error("Failed to update product availability:", error)
    }
  }

  useEffect(() => {
    fetchBrands()
    fetchCategories()
    fetchProducts()
  }, [])

  // Filter products based on search and filters
  const filteredProducts = products.filter((product) => {
    const brandName = getBrandName(product.brand_id).toLowerCase()
    const brandPrefix = getBrandPrefix(product.brand_id).toLowerCase()
    const categoryName = getCategoryName(product.category_id).toLowerCase()
    const searchLower = searchTerm.toLowerCase()
    
    const matchesSearch = product.name.toLowerCase().includes(searchLower) ||
                         brandName.includes(searchLower) ||
                         brandPrefix.includes(searchLower) ||
                         categoryName.includes(searchLower)
    
    return matchesSearch
  })

  // Export to CSV function
  const exportToCSV = () => {
    const csv = [
      ["Name", "Brand", "Brand Prefix", "Category", "Price", "Discount Price", "Active", "Units", "Min Order", "Created"],
      ...products.map(p => [
        p.name,
        getBrandName(p.brand_id),
        getBrandPrefix(p.brand_id),
        getCategoryName(p.category_id),
        p.price.toString(),
        p.discount_price.toString(),
        p.is_active ? "Yes" : "No",
        p.units.toString(),
        p.min_order_quantity.toString(),
        new Date(p.$createdAt).toLocaleDateString()
      ])
    ].map(row => row.join(",")).join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `products-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your product catalog, inventory, and pricing
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Total catalog items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.available}</div>
            <p className="text-xs text-muted-foreground">
              Ready for sale
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Sale</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.onSale}</div>
            <p className="text-xs text-muted-foreground">
              Discounted items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalValue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Catalog value
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Product Catalog</CardTitle>
          <CardDescription>
            View and manage all products in your catalog
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex items-center space-x-4 mb-6 flex-wrap gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={availableFilter} onValueChange={setAvailableFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="true">Available</SelectItem>
                <SelectItem value="false">Unavailable</SelectItem>
              </SelectContent>
            </Select>

            <Select value={catalogFilter} onValueChange={setCatalogFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.$id} value={category.$id}>{category.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {brands.map(brand => (
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

            <Button onClick={fetchProducts} variant="outline">
              Refresh
            </Button>
            
            <Button onClick={exportToCSV} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">Loading products...</p>
            </div>
          ) : (
            /* Table */
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10">
                        <p className="text-muted-foreground">No products found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => (
                      <TableRow key={product.$id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center">
                              <Package className="h-4 w-4 text-gray-400" />
                            </div>
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-muted-foreground">
                                ID: {product.$id.slice(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="font-medium">{getBrandName(product.brand_id)}</div>
                            <Badge variant="outline" className="text-xs font-mono">
                              {getBrandPrefix(product.brand_id)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{getCategoryName(product.category_id)}</div>
                          <div className="text-sm text-muted-foreground">
                            {product.units} units (min: {product.min_order_quantity})
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">${product.price.toFixed(2)}</div>
                            {product.discount_price > 0 && (
                              <div className="text-sm text-green-600">
                                Sale: ${product.discount_price.toFixed(2)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge
                              className={
                                product.is_active
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }
                            >
                              {product.is_active ? "Active" : "Inactive"}
                            </Badge>
                            {product.is_new && (
                              <Badge variant="outline" className="ml-1 border-blue-200 text-blue-700">
                                New
                              </Badge>
                            )}
                            {product.is_featured && (
                              <Badge variant="outline" className="ml-1 border-purple-200 text-purple-700">
                                Featured
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(product.$createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(product.$createdAt).toLocaleTimeString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/products/${product.$id}/edit`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => toggleAvailability(product.$id, product.is_active)}
                              >
                                {product.is_active ? (
                                  <>
                                    <AlertTriangle className="mr-2 h-4 w-4" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <ShoppingCart className="mr-2 h-4 w-4" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  setProductToDelete(product.$id)
                                  setDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              product from your catalog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}