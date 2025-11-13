"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, Eye, MoreHorizontal, Calendar, Truck, CheckCircle, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useAdminRealTimeData } from "@/hooks/useAdminRealTimeData"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Order interface matching the hook structure
interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  total_amount: number
  status: string
  payment_status: string
  fulfillment_status: string
  created_at: string
  updated_at: string
  item_count: number
  currency: string
  payment_method: string
  shipping_address: {
    city: string
    country: string
  }
}

interface OrderStats {
  total: number
  pending: number
  shipped: number
  delivered: number
  totalRevenue: number
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-800",
}

const paymentStatusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-800",
}

const fulfillmentStatusColors = {
  unfulfilled: "bg-gray-100 text-gray-800",
  partial: "bg-blue-100 text-blue-800",
  fulfilled: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
}

export default function OrdersPage() {
  const { 
    orders, 
    loading, 
    refetch,
    error 
  } = useAdminRealTimeData()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [fulfillmentFilter, setFulfillmentFilter] = useState("all")
  const [sortBy, setSortBy] = useState("created_at")
  const [sortOrder, setSortOrder] = useState("desc")

  // Calculate stats from real data
  const stats = useMemo((): OrderStats => {
    const total = orders.length
    const pending = orders.filter(o => o.status === 'pending').length
    const shipped = orders.filter(o => o.status === 'shipped').length
    const delivered = orders.filter(o => o.status === 'delivered').length
    const totalRevenue = orders
      .filter(o => o.payment_status === 'paid')
      .reduce((sum, o) => sum + (o.total_amount || 0), 0)

    return { total, pending, shipped, delivered, totalRevenue }
  }, [orders])

  // Update order status (placeholder - would connect to actual API)
  const updateOrderStatus = async (orderId: string, field: string, value: string) => {
    try {
      const updateData: any = {}
      updateData[field] = value
      
      if (field === 'status' && value === 'shipped') {
        updateData.updated_at = new Date().toISOString()
      }
      if (field === 'status' && value === 'delivered') {
        updateData.updated_at = new Date().toISOString()
      }

      console.log('Updating order', orderId, 'with data:', updateData)
      // In real implementation: await updateOrder(orderId, updateData)
      refetch() // Refresh data
    } catch (error) {
      console.error("Failed to update order:", error)
    }
  }

  // Filter and sort orders
  const filteredAndSortedOrders = useMemo(() => {
    let filtered = orders

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(order =>
        order.order_number?.toLowerCase().includes(searchLower) ||
        order.customer_name?.toLowerCase().includes(searchLower) ||
        order.customer_email?.toLowerCase().includes(searchLower) ||
        order.id?.toLowerCase().includes(searchLower)
      )
    }

    // Apply status filters
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter)
    }
    if (paymentFilter !== "all") {
      filtered = filtered.filter(order => order.payment_status === paymentFilter)
    }
    if (fulfillmentFilter !== "all") {
      filtered = filtered.filter(order => order.fulfillment_status === fulfillmentFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'created_at':
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
        case 'total_amount':
          aValue = a.total_amount || 0
          bValue = b.total_amount || 0
          break
        case 'customer_name':
          aValue = a.customer_name || ''
          bValue = b.customer_name || ''
          break
        case 'status':
          aValue = a.status || ''
          bValue = b.status || ''
          break
        default:
          aValue = a.created_at
          bValue = b.created_at
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [orders, searchTerm, statusFilter, paymentFilter, fulfillmentFilter, sortBy, sortOrder])

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">
            Manage customer orders and fulfillment
          </p>
          {error && (
            <div className="mt-2 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>
        <Button onClick={refetch} variant="outline" disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All time orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shipped</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.shipped}</div>
            <p className="text-xs text-muted-foreground">
              In transit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${stats.totalRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              From paid orders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Order Management</CardTitle>
          <CardDescription>
            Track and manage all customer orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters and Search */}
          <div className="flex items-center space-x-4 mb-6 flex-wrap gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>

            <Select value={fulfillmentFilter} onValueChange={setFulfillmentFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Fulfillment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unfulfilled">Unfulfilled</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="fulfilled">Fulfilled</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">Loading orders...</p>
            </div>
          ) : (
            /* Table */
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('order_number')}
                    >
                      Order {sortBy === 'order_number' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('customer_name')}
                    >
                      Customer {sortBy === 'customer_name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('total_amount')}
                    >
                      Total {sortBy === 'total_amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Fulfillment</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('created_at')}
                    >
                      Date {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10">
                        <p className="text-muted-foreground">No orders found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <div className="font-medium">{order.order_number}</div>
                          <div className="text-sm text-muted-foreground">
                            ID: {order.id.slice(0, 8)}...
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{order.customer_name}</div>
                          <div className="text-sm text-muted-foreground">{order.customer_email}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">${Number(order.total_amount ?? 0).toFixed(2)}</div>
                          <div className="text-sm text-muted-foreground">
                            {order.item_count || 0} items
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[order.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
                            {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={paymentStatusColors[order.payment_status as keyof typeof paymentStatusColors] || "bg-gray-100 text-gray-800"}>
                            {order.payment_status ? order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1) : 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={fulfillmentStatusColors[order.fulfillment_status as keyof typeof fulfillmentStatusColors] || "bg-gray-100 text-gray-800"}>
                            {order.fulfillment_status ? order.fulfillment_status.charAt(0).toUpperCase() + order.fulfillment_status.slice(1) : 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(order.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(order.created_at).toLocaleTimeString()}
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
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/orders/${order.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateOrderStatus(order.id, 'status', 'shipped')}
                                disabled={order.status === 'shipped' || order.status === 'delivered'}
                              >
                                <Truck className="mr-2 h-4 w-4" />
                                Mark as Shipped
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateOrderStatus(order.id, 'status', 'delivered')}
                                disabled={order.status === 'delivered'}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Mark as Delivered
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
    </div>
  )
}