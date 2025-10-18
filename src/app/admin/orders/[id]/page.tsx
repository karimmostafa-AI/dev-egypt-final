"use client"

import { useState, useEffect } from "react"
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

interface OrderItem {
  product_id: string
  product_name: string
  sku: string
  quantity: number
  price: number
  total: number
}

interface Address {
  full_name: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  postal_code: string
  country: string
  phone: string
}

interface Order {
  $id: string
  order_number: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  total_amount: number
  subtotal: number
  shipping_amount: number
  tax_amount: number
  discount_amount: number
  status: string
  payment_status: string
  fulfillment_status: string
  payment_method: string
  transaction_id?: string
  tracking_number: string
  carrier: string
  items: string // JSON string
  shipping_address: string // JSON string
  billing_address: string // JSON string
  notes: string
  $createdAt: string
  shipped_at?: string | null
  delivered_at?: string | null
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
  const [isLoading, setIsLoading] = useState(true)
  const [order, setOrder] = useState<Order | null>(null)
  const [newNote, setNewNote] = useState("")
  const [trackingNumber, setTrackingNumber] = useState("")
  const [carrier, setCarrier] = useState("")

  // Fetch order data
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/admin/orders?orderId=${params.id}`)
        const data = await response.json()
        
        if (data.order) {
          setOrder(data.order)
          setTrackingNumber(data.order.tracking_number || "")
          setCarrier(data.order.carrier || "")
        }
      } catch (error) {
        console.error("Failed to fetch order:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      fetchOrder()
    }
  }, [params.id])

  const updateOrderStatus = async (newStatus: string) => {
    if (!order) return
    
    setIsLoading(true)
    try {
      const updateData: any = { status: newStatus }
      
      if (newStatus === 'shipped') {
        updateData.shipped_at = new Date().toISOString()
      }
      if (newStatus === 'delivered') {
        updateData.delivered_at = new Date().toISOString()
      }

      const response = await fetch(`/api/admin/orders?orderId=${order.$id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })
      
      if (response.ok) {
        const data = await response.json()
        setOrder(data.order)
      }
    } catch (error) {
      console.error("Error updating order:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const addTrackingNumber = async () => {
    if (!order || !trackingNumber || !carrier) {
      alert("Please enter both tracking number and carrier")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/orders?orderId=${order.$id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tracking_number: trackingNumber,
          carrier: carrier,
          status: "shipped",
          fulfillment_status: "fulfilled",
          shipped_at: new Date().toISOString()
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setOrder(data.order)
        setTrackingNumber(data.order.tracking_number || "")
        setCarrier(data.order.carrier || "")
      }
    } catch (error) {
      console.error("Error adding tracking:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const addInternalNote = async () => {
    if (!order || !newNote.trim()) return

    try {
      const currentNotes = order.notes || ""
      const timestamp = new Date().toISOString()
      const noteEntry = `[${timestamp}] Admin: ${newNote}\n`
      const updatedNotes = currentNotes + noteEntry

      const response = await fetch(`/api/admin/orders?orderId=${order.$id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes: updatedNotes }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setOrder(data.order)
        setNewNote("")
      }
    } catch (error) {
      console.error("Error adding note:", error)
    }
  }

  // Parse JSON fields
  const parseJSON = (jsonString: string) => {
    try {
      return JSON.parse(jsonString)
    } catch {
      return null
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading order details...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="p-6 flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Order not found</p>
      </div>
    )
  }

  const items: OrderItem[] = parseJSON(order.items) || []
  const shippingAddress: Address = parseJSON(order.shipping_address) || {}
  const billingAddress: Address = parseJSON(order.billing_address) || {}
  const internalNotes = order.notes ? order.notes.split('\n').filter(n => n.trim()).map((note, idx) => ({
    $id: idx.toString(),
    note: note.replace(/^\[.*?\]\s*/, ''),
    timestamp: note.match(/\[(.*?)\]/)?.[1] || ''
  })) : []

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
            Order {order.order_number}
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
                  {items.map((item, idx) => (
                    <TableRow key={item.product_id || idx}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center">
                            <Package className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium">{item.product_name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{item.sku}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>${Number(item.price || 0).toFixed(2)}</TableCell>
                      <TableCell className="font-medium">${Number(item.total || 0).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Order Totals */}
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${Number(order.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping:</span>
                  <span>${Number(order.shipping_amount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax:</span>
                  <span>${Number(order.tax_amount || 0).toFixed(2)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount:</span>
                    <span>-${Number(order.discount_amount || 0).toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span>${Number(order.total_amount || 0).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order History */}
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Badge className={statusColors[order.status as keyof typeof statusColors]}>
                        {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'N/A'}
                      </Badge>
                    </div>
                    <p className="text-sm mt-1">Current Status</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(order.$createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                {order.shipped_at && (
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    </div>
                    <div className="flex-1">
                      <Badge className="bg-purple-100 text-purple-800">Shipped</Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(order.shipped_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                {order.delivered_at && (
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    </div>
                    <div className="flex-1">
                      <Badge className="bg-green-100 text-green-800">Delivered</Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(order.delivered_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
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
                <p className="font-medium">{order.customer_name}</p>
                <p className="text-sm text-muted-foreground">{order.customer_email}</p>
              </div>

              {order.customer_phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{order.customer_phone}</span>
                </div>
              )}

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
                <p className="font-medium">{shippingAddress.full_name}</p>
                <p>{shippingAddress.address_line1}</p>
                {shippingAddress.address_line2 && (
                  <p>{shippingAddress.address_line2}</p>
                )}
                <p>
                  {shippingAddress.city}, {shippingAddress.state}{" "}
                  {shippingAddress.postal_code}
                </p>
                <p>{shippingAddress.country}</p>
                <p className="text-muted-foreground">{shippingAddress.phone}</p>
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
                <span className="text-sm font-medium">{order.payment_method || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Status:</span>
                <Badge className={statusColors[order.payment_status as keyof typeof statusColors]}>
                  {order.payment_status ? order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1) : 'N/A'}
                </Badge>
              </div>
              {order.transaction_id && (
                <div className="flex justify-between">
                  <span className="text-sm">Transaction ID:</span>
                  <span className="text-sm font-mono">{order.transaction_id}</span>
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
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="carrier">Carrier</Label>
                    <Select
                      value={carrier}
                      onValueChange={(value) => setCarrier(value)}
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
                {internalNotes.length > 0 ? (
                  internalNotes.map((note) => (
                    <div key={note.$id} className="p-3 bg-muted rounded-lg">
                      <p className="text-sm">{note.note}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {note.timestamp ? new Date(note.timestamp).toLocaleString() : 'Unknown time'}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No notes yet</p>
                )}
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