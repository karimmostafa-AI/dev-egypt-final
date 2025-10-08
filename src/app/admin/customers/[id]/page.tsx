"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Save,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Package,
  Edit,
  Ban,
  CheckCircle,
  MessageSquare,
  Plus,
  ShoppingBag
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

// Mock customer data - in real app, this would be fetched based on the ID
const mockCustomer = {
  $id: "1",
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  phone: "+1 (555) 123-4567",
  ordersCount: 5,
  totalSpent: 899.95,
  averageOrderValue: 179.99,
  lastOrderDate: "2024-01-15T10:30:00Z",
  status: "active",
  segment: "vip",
  tags: ["premium", "loyal"],
  acceptsMarketing: true,
  emailVerified: true,
  addresses: [
    {
      fullName: "John Doe",
      addressLine1: "123 Main St",
      addressLine2: "Apt 4B",
      city: "New York",
      state: "NY",
      postalCode: "10001",
      country: "USA",
      phone: "+1 (555) 123-4567"
    }
  ],
  notes: [
    {
      $id: "1",
      note: "Prefers early morning deliveries",
      userId: "admin1",
      userName: "Admin User",
      createdAt: "2024-01-10T09:00:00Z"
    },
    {
      $id: "2",
      note: "Called about missing item in last order",
      userId: "admin2",
      userName: "Support Team",
      createdAt: "2024-01-12T14:30:00Z"
    }
  ]
}

// Mock order history for this customer
const mockOrderHistory = [
  {
    $id: "1",
    orderNumber: "#ORD-2024-001",
    total: 299.99,
    status: "delivered",
    createdAt: "2024-01-15T10:30:00Z",
    items: [
      { name: "Premium Cotton T-Shirt", quantity: 2, price: 29.99 },
      { name: "Medical Scrub Set", quantity: 1, price: 240.00 }
    ]
  },
  {
    $id: "2",
    orderNumber: "#ORD-2023-045",
    total: 149.99,
    status: "delivered",
    createdAt: "2023-12-20T15:45:00Z",
    items: [
      { name: "Chef Jacket White", quantity: 1, price: 49.99 },
      { name: "Restaurant Apron", quantity: 2, price: 49.75 }
    ]
  },
  {
    $id: "3",
    orderNumber: "#ORD-2023-032",
    total: 89.99,
    status: "delivered",
    createdAt: "2023-11-15T09:20:00Z",
    items: [
      { name: "Lab Coat Premium", quantity: 1, price: 89.99 }
    ]
  }
]

const segmentColors = {
  vip: "bg-purple-100 text-purple-800",
  regular: "bg-blue-100 text-blue-800",
  "at-risk": "bg-yellow-100 text-yellow-800",
  inactive: "bg-gray-100 text-gray-800",
}

const statusColors = {
  active: "bg-green-100 text-green-800",
  blocked: "bg-red-100 text-red-800",
}

export default function CustomerDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [customer, setCustomer] = useState(mockCustomer)
  const [newNote, setNewNote] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const updateCustomerStatus = async (newStatus: "active" | "blocked") => {
    setIsLoading(true)
    try {
      // Here you would update the customer status via Appwrite
      console.log("Updating customer status to:", newStatus)

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Update local state
      setCustomer(prev => ({ ...prev, status: newStatus }))
    } catch (error) {
      console.error("Error updating customer:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const addCustomerNote = async () => {
    if (!newNote.trim()) return

    try {
      // Here you would add the note via Appwrite
      console.log("Adding customer note:", newNote)

      // Update local state
      setCustomer(prev => ({
        ...prev,
        notes: [
          ...prev.notes,
          {
            $id: Date.now().toString(),
            note: newNote,
            userId: "admin1",
            userName: "Admin User",
            createdAt: new Date().toISOString()
          }
        ]
      }))
      setNewNote("")
    } catch (error) {
      console.error("Error adding note:", error)
    }
  }

  const updateCustomerSegment = async (newSegment: string) => {
    setIsLoading(true)
    try {
      // Here you would update the customer segment via Appwrite
      console.log("Updating customer segment to:", newSegment)

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Update local state
      setCustomer(prev => ({ ...prev, segment: newSegment as any }))
    } catch (error) {
      console.error("Error updating segment:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/customers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {customer.firstName} {customer.lastName}
          </h1>
          <p className="text-muted-foreground">
            Customer profile and order history
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Mail className="mr-2 h-4 w-4" />
            Send Email
          </Button>
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit Customer
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{customer.ordersCount}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                  <p className="text-2xl font-bold">${customer.totalSpent.toFixed(2)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Average Order</p>
                  <p className="text-2xl font-bold">${customer.averageOrderValue.toFixed(2)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Last Order</p>
                  <p className="text-sm">
                    {customer.lastOrderDate
                      ? new Date(customer.lastOrderDate).toLocaleDateString()
                      : "Never"
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingBag className="mr-2 h-5 w-5" />
                Order History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockOrderHistory.map((order) => (
                    <TableRow key={order.$id}>
                      <TableCell className="font-medium">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {order.items.slice(0, 2).map((item, index) => (
                            <div key={index} className="text-sm">
                              {item.quantity}x {item.name}
                            </div>
                          ))}
                          {order.items.length > 2 && (
                            <div className="text-sm text-muted-foreground">
                              +{order.items.length - 2} more items
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>${order.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[order.status as keyof typeof statusColors]}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Customer Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="mr-2 h-5 w-5" />
                Customer Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {customer.notes.map((note) => (
                  <div key={note.$id} className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">{note.note}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {note.userName} • {new Date(note.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Add Note</Label>
                <Textarea
                  id="note"
                  placeholder="Add a note about this customer..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                />
                <Button onClick={addCustomerNote} size="sm" className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Note
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium">{customer.firstName} {customer.lastName}</p>
                <p className="text-sm text-muted-foreground">{customer.email}</p>
                {customer.emailVerified && (
                  <Badge variant="outline" className="mt-1">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Verified
                  </Badge>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{customer.phone}</span>
              </div>

              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {customer.acceptsMarketing ? "Receives marketing" : "No marketing"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Customer Status */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Current Status</Label>
                <div className="flex items-center space-x-2">
                  <Badge className={statusColors[customer.status as keyof typeof statusColors]}>
                    {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Customer Segment</Label>
                <Select value={customer.segment} onValueChange={updateCustomerSegment}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vip">VIP</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="at-risk">At Risk</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {customer.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Button
                  variant={customer.status === "active" ? "destructive" : "default"}
                  className="w-full"
                  onClick={() => updateCustomerStatus(customer.status === "active" ? "blocked" : "active")}
                  disabled={isLoading}
                >
                  {customer.status === "active" ? (
                    <>
                      <Ban className="mr-2 h-4 w-4" />
                      Block Customer
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Activate Customer
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="mr-2 h-5 w-5" />
                Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                <p className="font-medium">{customer.addresses[0]?.fullName}</p>
                <p>{customer.addresses[0]?.addressLine1}</p>
                {customer.addresses[0]?.addressLine2 && (
                  <p>{customer.addresses[0].addressLine2}</p>
                )}
                <p>
                  {customer.addresses[0]?.city}, {customer.addresses[0]?.state}{" "}
                  {customer.addresses[0]?.postalCode}
                </p>
                <p>{customer.addresses[0]?.country}</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Mail className="mr-2 h-4 w-4" />
                Send Welcome Email
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Package className="mr-2 h-4 w-4" />
                View Order History
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Edit className="mr-2 h-4 w-4" />
                Edit Customer Details
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}