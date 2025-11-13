"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Warehouse } from "lucide-react"

export default function AdminV2InventoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Inventory</h1>
        <p className="text-muted-foreground mt-1">
          Manage your inventory and stock levels
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Management</CardTitle>
          <CardDescription>
            Track and manage product inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Warehouse className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Inventory management coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

