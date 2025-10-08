"use client"

import { useState, useEffect } from "react"
import { Search, Plus, Edit, Trash2, MoreHorizontal, RefreshCw, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface Brand {
  $id: string
  name: string
  logo_id: string | null
  prefix: string
  status: boolean
  $createdAt: string
  $updatedAt: string
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    logo_id: "",
    prefix: "",
    status: true
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch brands
  const fetchBrands = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/brands')
      const data = await response.json()
      
      if (data.error) {
        console.error("Error:", data.error)
        return
      }

      setBrands(data.brands || [])
    } catch (error) {
      console.error("Failed to fetch brands:", error)
    } finally {
      setLoading(false)
    }
  }

  // Create brand
  const createBrand = async () => {
    if (!formData.name.trim() || !formData.prefix.trim()) {
      alert("Brand name and prefix are required")
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch('/api/admin/brands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          logo_id: formData.logo_id || null
        }),
      })

      const result = await response.json()

      if (response.ok) {
        fetchBrands()
        setIsCreateDialogOpen(false)
        setFormData({ name: "", logo_id: "", prefix: "", status: true })
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error("Error creating brand:", error)
      alert("Failed to create brand")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update brand
  const updateBrand = async () => {
    if (!formData.name.trim() || !formData.prefix.trim() || !selectedBrand) {
      alert("Brand name and prefix are required")
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/admin/brands?brandId=${selectedBrand.$id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          logo_id: formData.logo_id || null
        }),
      })

      const result = await response.json()

      if (response.ok) {
        fetchBrands()
        setIsEditDialogOpen(false)
        setSelectedBrand(null)
        setFormData({ name: "", logo_id: "", prefix: "", status: true })
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error("Error updating brand:", error)
      alert("Failed to update brand")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete brand
  const deleteBrand = async () => {
    if (!selectedBrand) return

    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/admin/brands?brandId=${selectedBrand.$id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchBrands()
        setIsDeleteDialogOpen(false)
        setSelectedBrand(null)
      } else {
        const result = await response.json()
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error("Error deleting brand:", error)
      alert("Failed to delete brand")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Toggle brand status
  const toggleStatus = async (brand: Brand) => {
    try {
      const response = await fetch(`/api/admin/brands?brandId=${brand.$id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: !brand.status }),
      })

      if (response.ok) {
        fetchBrands()
      }
    } catch (error) {
      console.error("Error updating brand status:", error)
    }
  }

  useEffect(() => {
    fetchBrands()
  }, [])

  // Filter brands based on search
  const filteredBrands = brands.filter((brand) =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    brand.prefix.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const openEditDialog = (brand: Brand) => {
    setSelectedBrand(brand)
    setFormData({
      name: brand.name,
      logo_id: brand.logo_id || "",
      prefix: brand.prefix,
      status: brand.status
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (brand: Brand) => {
    setSelectedBrand(brand)
    setIsDeleteDialogOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Brands</h1>
          <p className="text-muted-foreground">
            Manage product brands for your store
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchBrands} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Brand
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Brand</DialogTitle>
                <DialogDescription>
                  Add a new brand to organize your products
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Brand Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., DEV EGYPT, Nike, Adidas"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prefix">Brand Prefix *</Label>
                  <Input
                    id="prefix"
                    placeholder="e.g., DEV-EGYPT, NIKE, ADIDAS"
                    value={formData.prefix}
                    onChange={(e) => setFormData(prev => ({ ...prev, prefix: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Used for product codes and identification
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo_id">Logo ID</Label>
                  <div className="space-y-2">
                    <Input
                      id="logo_id"
                      placeholder="Appwrite storage logo ID (optional)"
                      value={formData.logo_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, logo_id: e.target.value }))}
                    />
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="sm">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Logo
                      </Button>
                      <span className="text-xs text-muted-foreground">or enter logo ID above</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="status"
                    checked={formData.status}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, status: checked }))}
                  />
                  <Label htmlFor="status">Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createBrand} disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Brand"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Brands</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brands.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {brands.filter(b => b.status).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {brands.filter(b => !b.status).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Brands Table */}
      <Card>
        <CardHeader>
          <CardTitle>Brand Management</CardTitle>
          <CardDescription>
            View and manage all product brands
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search brands..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">Loading brands...</p>
            </div>
          ) : (
            /* Table */
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Brand</TableHead>
                    <TableHead>Prefix</TableHead>
                    <TableHead>Logo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBrands.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10">
                        <p className="text-muted-foreground">No brands found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBrands.map((brand) => (
                      <TableRow key={brand.$id}>
                        <TableCell>
                          <div className="font-medium">{brand.name}</div>
                          <div className="text-sm text-muted-foreground">
                            ID: {brand.$id.slice(0, 8)}...
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {brand.prefix}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {brand.logo_id ? (
                            <div className="text-sm text-green-600">Has Logo</div>
                          ) : (
                            <div className="text-sm text-muted-foreground">No Logo</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              brand.status
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }
                          >
                            {brand.status ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(brand.$createdAt).toLocaleDateString()}
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
                              <DropdownMenuItem onClick={() => openEditDialog(brand)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleStatus(brand)}>
                                {brand.status ? "Deactivate" : "Activate"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => openDeleteDialog(brand)}
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Brand</DialogTitle>
            <DialogDescription>
              Update brand information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Brand Name *</Label>
              <Input
                id="edit-name"
                placeholder="Brand name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-prefix">Brand Prefix *</Label>
              <Input
                id="edit-prefix"
                placeholder="Brand prefix"
                value={formData.prefix}
                onChange={(e) => setFormData(prev => ({ ...prev, prefix: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-logo_id">Logo ID</Label>
              <Input
                id="edit-logo_id"
                placeholder="Appwrite storage logo ID (optional)"
                value={formData.logo_id}
                onChange={(e) => setFormData(prev => ({ ...prev, logo_id: e.target.value }))}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-status"
                checked={formData.status}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, status: checked }))}
              />
              <Label htmlFor="edit-status">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateBrand} disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Brand"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the brand
              "{selectedBrand?.name}" from your database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteBrand}
              className="bg-red-600 hover:bg-red-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
