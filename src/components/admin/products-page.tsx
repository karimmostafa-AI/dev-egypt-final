"use client"

import { useState, useMemo, useEffect } from "react"
import { useAdminRealTimeData } from "@/hooks/useAdminRealTimeData"
import { Search, MoreHorizontal, Trash2, Eye, Package, Plus, Edit, DollarSign, ShoppingCart, AlertTriangle, Download, RefreshCw } from "lucide-react"

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

interface ProductStats {
  total: number
  available: number
  unavailable: number
  onSale: number
  lowStock: number
  outOfStock: number
  totalValue: number
}

export default function ProductsPage() {
  const { 
    products, 
    loading, 
    refetch,
    error 
  } = useAdminRealTimeData()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [stockFilter, setStockFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState("asc")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<string | null>(null)

  // Transform products from the hook format
  const transformedProducts = useMemo(() => {
    return products.map(product => ({
      $id: product.id,
      name: product.name,
      sku: product.sku || '',
      price: product.price || 0,
      discount_price: product.discount_price || 0,
      available_units: product.available_units || 0,
      reserved_units: product.reserved_units || 0,
      stock_status: product.stock_status || 'in_stock',
      category_id: product.category_id || '',
      brand_id: product.brand_id || '',
      is_active: product.is_active !== false,
      is_featured: product.is_featured || false,
      sales_count: product.sales_count || 0,
      last_restocked_at: product.last_restocked_at,
      low_stock_threshold: product.low_stock_threshold || 5,
      image_url: product.image_url,
      $createdAt: product.updated_at,
      updated_at: product.updated_at,
      is_new: product.sales_count === 0 // Consider products with 0 sales as new
    }))
  }, [products])

  // Calculate stats from real data
  const stats = useMemo((): ProductStats => {
    const total = transformedProducts.length
    const available = transformedProducts.filter(p => p.stock_status === 'in_stock').length
    const unavailable = transformedProducts.filter(p => p.stock_status === 'out_of_stock').length
    const onSale = transformedProducts.filter(p => p.discount_price > 0 && p.discount_price < p.price).length
    const lowStock = transformedProducts.filter(p => p.stock_status === 'low_stock').length
    const outOfStock = transformedProducts.filter(p => p.stock_status === 'out_of_stock').length
    const totalValue = transformedProducts.reduce((sum, p) => {
      const unitPrice = p.discount_price > 0 ? p.discount_price : p.price
      return sum + (unitPrice * p.available_units)
    }, 0)

    return { total, available, unavailable, onSale, lowStock, outOfStock, totalValue }
  }, [transformedProducts])

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = transformedProducts

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(product =>
        product.name?.toLowerCase().includes(searchLower) ||
        product.sku?.toLowerCase().includes(searchLower) ||
        product.category_id?.toLowerCase().includes(searchLower) ||
        product.brand_id?.toLowerCase().includes(searchLower)
      )
    }

    // Apply stock status filter
    if (stockFilter !== "all") {
      filtered = filtered.filter(product => product.stock_status === stockFilter)
    }

    // Apply status filter
    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        filtered = filtered.filter(product => product.is_active)
      } else if (statusFilter === "inactive") {
        filtered = filtered.filter(product => !product.is_active)
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'name':
          aValue = a.name || ''
          bValue = b.name || ''
          break
        case 'price':
          aValue = a.price || 0
          bValue = b.price || 0
          break
        case 'stock':
          aValue = a.available_units || 0
          bValue = b.available_units || 0
          break
        case 'sales':
          aValue = a.sales_count || 0
          bValue = b.sales_count || 0
          break
        default:
          aValue = a.name || ''
          bValue = b.name || ''
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [transformedProducts, searchTerm, stockFilter, statusFilter, sortBy, sortOrder])

  // Toggle product availability (placeholder - would connect to actual API)
  const toggleAvailability = async (productId: string, currentAvailability: boolean) => {
    try {
      console.log('Toggling product availability', productId, 'from', currentAvailability, 'to', !currentAvailability)
      // In real implementation: await updateProduct(productId, { is_active: !currentAvailability })
      refetch() // Refresh data
    } catch (error) {
      console.error("Failed to update product availability:", error)
    }
  }

  // Delete product (placeholder - would connect to actual API)
  const handleDelete = async () => {
    if (!productToDelete) return

    try {
      console.log('Deleting product', productToDelete)
      // In real implementation: await deleteProduct(productToDelete)
      refetch() // Refresh data
      setDeleteDialogOpen(false)
      setProductToDelete(null)
    } catch (error) {
      console.error("Failed to delete product:", error)
    }
  }

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'bg-green-100 text-green-800'
      case 'low_stock':
        return 'bg-yellow-100 text-yellow-800'
      case 'out_of_stock':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
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
          {error && (
            <div className="mt-2 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={refetch} variant="outline" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
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
            <CardTitle className="text-sm font-medium">In Stock</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.available}</div>
            <p className="text-xs text-muted-foreground">
              Available for sale
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
            
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Stock Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock</SelectItem>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="low_stock">Low Stock</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
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
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('name')}
                    >
                      Product {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead>Brand/Category</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('price')}
                    >
                      Price {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('stock')}
                    >
                      Stock {sortBy === 'stock' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('sales')}
                    >
                      Sales {sortBy === 'sales' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10">
                        <p className="text-muted-foreground">No products found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedProducts.map((product) => (
                      <TableRow key={product.$id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center">
                              <Package className="h-4 w-4 text-gray-400" />
                            </div>
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-muted-foreground">
                                SKU: {product.sku || 'N/A'} • ID: {product.$id.slice(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">{product.brand_id || 'No Brand'}</div>
                            <div className="text-xs text-muted-foreground">{product.category_id || 'No Category'}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">${product.price.toFixed(2)}</div>
                            {product.discount_price > 0 && product.discount_price < product.price && (
                              <div className="text-sm text-green-600">
                                Sale: ${product.discount_price.toFixed(2)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{product.available_units} units</div>
                            <div className="text-xs text-muted-foreground">
                              {product.reserved_units} reserved
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge
                              className={getStockStatusColor(product.stock_status)}
                            >
                              {product.stock_status?.replace('_', ' ') || 'Unknown'}
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
                            {product.sales_count} sales
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
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
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