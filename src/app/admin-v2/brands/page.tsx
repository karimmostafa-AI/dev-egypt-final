"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Building2 } from "lucide-react"

export default function AdminV2BrandsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Brands</h1>
          <p className="text-muted-foreground mt-1">
            Manage product brands
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Brand
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Brand Management</CardTitle>
          <CardDescription>
            Manage your product brands
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Brand management coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

