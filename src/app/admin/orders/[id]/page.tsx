"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Save,
  Truck,
  CheckCircle,
  XCircle,
  Printer,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Calendar,
  Clock,
  Package,
  User,
  DollarSign
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

// Mock order data - in real app, this would be fetched based on the ID
const mockOrder = {
  $id: "1",
  orderNumber: "#ORD-2024-001",
  customerName: "John Doe",
  customerEmail: "john@example.com",
  customerPhone: "+1 (555) 123-4567",
  total: 299.99,
  subtotal: 269.99,
  shippingCost: 15.00,
  taxAmount: 15.00,
  discountAmount: 0,
  status: "processing",
  paymentStatus: "paid",
  fulfillmentStatus: "unfulfilled",
  paymentMethod: "Credit Card",
  transactionId: "txn_1234567890",
  trackingNumber: "",
  carrier: "",
  items: [
    {
      productId: "1",
      productName: "Premium Cotton T-Shirt",
      productImage: "/placeholder-product.jpg",
      sku: "PCT-001",
      quantity: 2,
      price: 29.99,
      total: 59.98
    },
    {
      productId: "2",
      productName: "Medical Scrub Set",
      productImage: "/placeholder-product.jpg",
      sku: "MSS-002",
      quantity: 1,
      price: 240.00,
      total: 240.00
    }
  ],
  shippingAddress: {
    fullName: "John Doe",
    addressLine1: "123 Main St",
    addressLine2: "Apt 4B",
    city: "New York",
    state: "NY",
    postalCode: "10001",
    country: "USA",
    phone: "+1 (555) 123-4567"
  },
  billingAddress: {
    fullName: "John Doe",
    addressLine1: "123 Main St",
    addressLine2: "Apt 4B",
    city: "New York",
    state: "NY",
    postalCode: "10001",
    country: "USA",
    phone: "+1 (555) 123-4567"
  },
  createdAt: "2024-01-15T10:30:00Z",
  shippedAt: null as string | null,
  deliveredAt: null as string | null,
  customerNote: "Please leave at front door if not home",
  internalNotes: [
    {
      $id: "1",
      note: "Customer called about delivery time",
      userId: "admin1",
      userName: "Admin User",
      createdAt: "2024-01-15T11:00:00Z"
    }
  ],
  timeline: [
    {
      status: "pending",
      changedBy: "System",
      changedAt: "2024-01-15T10:30:00Z",
      note: "Order placed"
    },
    {
      status: "processing",
      changedBy: "Admin User",
      changedAt: "2024-01-15T10:35:00Z",
      note: "Payment confirmed, processing order"
    }
  ]
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-800",
}

export default function OrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [order, setOrder] = useState(mockOrder)
  const [newNote, setNewNote] = useState("")

  const updateOrderStatus = async (newStatus: string) => {
    setIsLoading(true)
    try {
      // Here you would update the order status via Appwrite
      console.log("Updating order status to:", newStatus)

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Update local state
      setOrder(prev => ({
        ...prev,
        status: newStatus as any,
        timeline: [
          ...prev.timeline,
          {
            status: newStatus,
            changedBy: "Admin User",
            changedAt: new Date().toISOString(),
            note: `Status changed to ${newStatus}`
          }
        ]
      }))
    } catch (error) {
      console.error("Error updating order:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const addTrackingNumber = async () => {
    if (!order.trackingNumber || !order.carrier) {
      alert("Please enter both tracking number and carrier")
      return
    }

    setIsLoading(true)
    try {
      // Here you would update the order with tracking info via Appwrite
      console.log("Adding tracking:", order.trackingNumber, order.carrier)

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Update local state
      setOrder(prev => ({
        ...prev,
        status: "shipped",
        fulfillmentStatus: "fulfilled",
        shippedAt: new Date().toISOString(),
        deliveredAt: null as any,
        timeline: [
          ...prev.timeline,
          {
            status: "shipped",
            changedBy: "Admin User",
            changedAt: new Date().toISOString(),
            note: `Shipped via ${order.carrier} - Tracking: ${order.trackingNumber}`
          }
        ]
      }))
    } catch (error) {
      console.error("Error adding tracking:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const addInternalNote = async () => {
    if (!newNote.trim()) return

    try {
      // Here you would add the note via Appwrite
      console.log("Adding note:", newNote)

      // Update local state
      setOrder(prev => ({
        ...prev,
        internalNotes: [
          ...prev.internalNotes,
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/orders">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Order {order.orderNumber}
          </h1>
          <p className="text-muted-foreground">
            Manage order details and fulfillment
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Print Invoice
          </Button>
          <Button variant="outline">
            <Mail className="mr-2 h-4 w-4" />
            Email Customer
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.productId}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center">
                            <Package className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium">{item.productName}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{item.sku}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>${item.price.toFixed(2)}</TableCell>
                      <TableCell className="font-medium">${item.total.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Order Totals */}
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping:</span>
                  <span>${order.shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax:</span>
                  <span>${order.taxAmount.toFixed(2)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount:</span>
                    <span>-${order.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Order Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.timeline.map((event, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                      {index < order.timeline.length - 1 && (
                        <div className="w-px bg-border ml-1 h-8"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Badge className={statusColors[event.status as keyof typeof statusColors]}>
                          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          by {event.changedBy}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{event.note}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(event.changedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium">{order.customerName}</p>
                <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
              </div>

              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{order.customerPhone}</span>
              </div>

              <Button variant="outline" size="sm" className="w-full">
                View Customer Profile
              </Button>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="mr-2 h-5 w-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                <p className="font-medium">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && (
                  <p>{order.shippingAddress.addressLine2}</p>
                )}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                  {order.shippingAddress.postalCode}
                </p>
                <p>{order.shippingAddress.country}</p>
                <p className="text-muted-foreground">{order.shippingAddress.phone}</p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Method:</span>
                <span className="text-sm font-medium">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Status:</span>
                <Badge className={statusColors[order.paymentStatus as keyof typeof statusColors]}>
                  {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                </Badge>
              </div>
              {order.transactionId && (
                <div className="flex justify-between">
                  <span className="text-sm">Transaction ID:</span>
                  <span className="text-sm font-mono">{order.transactionId}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Status & Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Order Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Update Status</Label>
                <Select
                  value={order.status}
                  onValueChange={updateOrderStatus}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {order.status === "processing" && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="tracking">Tracking Number</Label>
                    <Input
                      id="tracking"
                      placeholder="Enter tracking number"
                      value={order.trackingNumber}
                      onChange={(e) => setOrder(prev => ({ ...prev, trackingNumber: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="carrier">Carrier</Label>
                    <Select
                      value={order.carrier}
                      onValueChange={(value) => setOrder(prev => ({ ...prev, carrier: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select carrier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ups">UPS</SelectItem>
                        <SelectItem value="fedex">FedEx</SelectItem>
                        <SelectItem value="usps">USPS</SelectItem>
                        <SelectItem value="dhl">DHL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={addTrackingNumber} disabled={isLoading} className="w-full">
                    <Truck className="mr-2 h-4 w-4" />
                    Mark as Shipped
                  </Button>
                </div>
              )}

              {order.status === "shipped" && (
                <Button onClick={() => updateOrderStatus("delivered")} disabled={isLoading} className="w-full">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark as Delivered
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Internal Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Internal Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {order.internalNotes.map((note) => (
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
                  placeholder="Add an internal note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                />
                <Button onClick={addInternalNote} size="sm" className="w-full">
                  Add Note
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}