"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  BarChart3,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Eye,
  RefreshCw,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Target,
  Zap,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Types for dashboard data
interface DashboardMetrics {
  totalRevenue: number
  totalOrders: number
  totalCustomers: number
  averageOrderValue: number
  revenueChange: number
  ordersChange: number
  customersChange: number
  aovChange: number
}

interface RecentOrder {
  $id: string
  order_number: string
  customer_name: string
  customer_email: string
  total: number
  status: string
  payment_status: string
  $createdAt: string
}

interface LowStockProduct {
  $id: string
  name: string
  stock: number
  threshold: number
  price: number
}

interface DashboardData {
  metrics: DashboardMetrics
  recentOrders: RecentOrder[]
  lowStockProducts: LowStockProduct[]
  orderStatuses: {
    pending: number
    processing: number
    shipped: number
    delivered: number
    cancelled: number
  }
  productStats: {
    total: number
    active: number
    inactive: number
    featured: number
    lowStock: number
    outOfStock: number
  }
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
}

export default function AdminV2Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState("month")

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin/dashboard')
      const data = await response.json()
      
      if (data.error) {
        setError(data.error)
      } else {
        setDashboardData(data)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [timeRange])

  if (loading && !dashboardData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !dashboardData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-4" />
            <p className="text-destructive mb-4">{error || 'Failed to load dashboard data'}</p>
            <Button onClick={fetchDashboardData} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const { metrics, recentOrders, lowStockProducts, orderStatuses, productStats } = dashboardData

  // Calculate order status percentages
  const totalOrderStatuses = Object.values(orderStatuses).reduce((a, b) => a + b, 0)
  const orderStatusPercentages = {
    pending: totalOrderStatuses > 0 ? (orderStatuses.pending / totalOrderStatuses) * 100 : 0,
    processing: totalOrderStatuses > 0 ? (orderStatuses.processing / totalOrderStatuses) * 100 : 0,
    shipped: totalOrderStatuses > 0 ? (orderStatuses.shipped / totalOrderStatuses) * 100 : 0,
    delivered: totalOrderStatuses > 0 ? (orderStatuses.delivered / totalOrderStatuses) * 100 : 0,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's an overview of your store's performance.
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchDashboardData} variant="outline" size="icon" disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button asChild>
            <Link href="/">
              <Eye className="mr-2 h-4 w-4" />
              View Store
            </Link>
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${metrics.totalRevenue.toLocaleString()}
            </div>
            <div className="flex items-center mt-2 text-xs">
              {metrics.revenueChange >= 0 ? (
                <span className="flex items-center text-green-600 dark:text-green-400">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  {metrics.revenueChange}%
                </span>
              ) : (
                <span className="flex items-center text-red-600 dark:text-red-400">
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                  {Math.abs(metrics.revenueChange)}%
                </span>
              )}
              <span className="text-muted-foreground ml-2">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <ShoppingCart className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {metrics.totalOrders}
            </div>
            <div className="flex items-center mt-2 text-xs">
              {metrics.ordersChange >= 0 ? (
                <span className="flex items-center text-green-600 dark:text-green-400">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  {metrics.ordersChange}%
                </span>
              ) : (
                <span className="flex items-center text-red-600 dark:text-red-400">
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                  {Math.abs(metrics.ordersChange)}%
                </span>
              )}
              <span className="text-muted-foreground ml-2">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {metrics.totalCustomers}
            </div>
            <div className="flex items-center mt-2 text-xs">
              {metrics.customersChange >= 0 ? (
                <span className="flex items-center text-green-600 dark:text-green-400">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  {metrics.customersChange}%
                </span>
              ) : (
                <span className="flex items-center text-red-600 dark:text-red-400">
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                  {Math.abs(metrics.customersChange)}%
                </span>
              )}
              <span className="text-muted-foreground ml-2">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center">
              <Target className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${metrics.averageOrderValue.toFixed(2)}
            </div>
            <div className="flex items-center mt-2 text-xs">
              {metrics.aovChange >= 0 ? (
                <span className="flex items-center text-green-600 dark:text-green-400">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  {metrics.aovChange}%
                </span>
              ) : (
                <span className="flex items-center text-red-600 dark:text-red-400">
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                  {Math.abs(metrics.aovChange)}%
                </span>
              )}
              <span className="text-muted-foreground ml-2">from last period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productStats.active}</div>
            <p className="text-xs text-muted-foreground">
              of {productStats.total} total products
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{productStats.lowStock}</div>
            <p className="text-xs text-muted-foreground">
              Need restocking
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{orderStatuses.pending}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Featured Products</CardTitle>
            <Zap className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{productStats.featured}</div>
            <p className="text-xs text-muted-foreground">
              Highlighted items
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Order Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
            <CardDescription>
              Current order status breakdown
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                  <span className="text-sm font-medium">Pending</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">{orderStatuses.pending} orders</span>
                  <span className="text-sm font-medium">{orderStatusPercentages.pending.toFixed(1)}%</span>
                </div>
              </div>
              <Progress value={orderStatusPercentages.pending} className="h-2" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm font-medium">Processing</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">{orderStatuses.processing} orders</span>
                  <span className="text-sm font-medium">{orderStatusPercentages.processing.toFixed(1)}%</span>
                </div>
              </div>
              <Progress value={orderStatusPercentages.processing} className="h-2" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                  <span className="text-sm font-medium">Shipped</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">{orderStatuses.shipped} orders</span>
                  <span className="text-sm font-medium">{orderStatusPercentages.shipped.toFixed(1)}%</span>
                </div>
              </div>
              <Progress value={orderStatusPercentages.shipped} className="h-2" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium">Delivered</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">{orderStatuses.delivered} orders</span>
                  <span className="text-sm font-medium">{orderStatusPercentages.delivered.toFixed(1)}%</span>
                </div>
              </div>
              <Progress value={orderStatusPercentages.delivered} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Low Stock Alerts
            </CardTitle>
            <CardDescription>
              Products that need immediate restocking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {lowStockProducts.length > 0 ? (
              <>
                {lowStockProducts.slice(0, 5).map((product) => (
                  <div key={product.$id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-medium">{product.name}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{product.stock} remaining</span>
                        <span>Threshold: {product.threshold}</span>
                        <span>${product.price.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="w-24 ml-4">
                      <Progress
                        value={Math.min((product.stock / product.threshold) * 100, 100)}
                        className="h-2"
                      />
                    </div>
                  </div>
                ))}
                {lowStockProducts.length > 5 && (
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/admin-v2/products">
                      View All {lowStockProducts.length} Low Stock Items
                    </Link>
                  </Button>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">All products are well stocked</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>
                Latest orders from your store
              </CardDescription>
            </div>
            <Button variant="outline" asChild>
              <Link href="/admin-v2/orders">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentOrders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.$id}>
                    <TableCell className="font-medium">
                      <Link href={`/admin-v2/orders/${order.$id}`} className="hover:underline text-primary">
                        {order.order_number || `#${order.$id.slice(0, 8)}`}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.customer_name || 'Unknown'}</div>
                        <div className="text-xs text-muted-foreground">{order.customer_email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(order.$createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium">
                      ${Number(order.total_amount ?? order.total ?? 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[order.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin-v2/orders/${order.$id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No orders yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

