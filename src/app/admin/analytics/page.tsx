"use client"

import { useState, useEffect } from 'react'
import { Header } from '@/components/analytics/Header'
import { SummaryCards } from '@/components/analytics/SummaryCards'
import { SalesChart } from '@/components/analytics/SalesChart'
import { OrdersByChannelChart } from '@/components/analytics/OrdersByChannelChart'
import { TopProductsChart } from '@/components/analytics/TopProductsChart'
import { CustomersChart } from '@/components/analytics/CustomersChart'
import { TrafficSourcesChart } from '@/components/analytics/TrafficSourcesChart'
import { RecentOrdersTable } from '@/components/analytics/RecentOrdersTable'
import { LiveVisitorsWidget } from '@/components/analytics/LiveVisitorsWidget'
import { TimeRange } from '@/types/analytics'
// Removed mock data imports - now using real data from API
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface AnalyticsData {
  period: {
    from: string
    to: string
    days: number
  }
  summary: {
    totalRevenue: number
    totalOrders: number
    averageOrderValue: number
    newCustomers: number
    avgCustomerLifetimeValue: number
  }
  charts: {
    dailyRevenue: Array<{
      date: string
      revenue: number
      orders: number
    }>
    topProducts: Array<{
      id: string
      name: string
      revenue: number
      quantity: number
    }>
    orderStatusDistribution: Record<string, number>
    paymentMethodDistribution: Array<{
      method: string
      count: number
    }>
    ordersByChannel?: Array<{
      channel: string
      orders: number
      revenue: number
      percentage: number
    }>
    customerGrowth?: Array<{
      date: string
      newCustomers: number
      returningCustomers: number
      totalCustomers: number
    }>
    trafficSources?: Array<{
      source: string
      visits: number
      conversions: number
      conversionRate: number
    }>
    recentOrders?: Array<{
      id: string
      customer: string
      total: number
      status: 'pending' | 'processing' | 'completed' | 'cancelled'
      date: string
    }>
  }
  insights: {
    totalProducts: number
    activeProducts: number
    lowStockProducts: number
    totalCustomers: number
    repeatCustomers: number
  }
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30days')
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = async (period: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/admin/analytics?period=${period}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data')
      }
      
      const data = await response.json()
      setAnalyticsData(data)
    } catch (err) {
      console.error('Error fetching analytics:', err)
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const periodMap: Record<TimeRange, string> = {
      'today': '1',
      '7days': '7',
      '30days': '30',
      'custom': '30'
    }
    
    fetchAnalytics(periodMap[timeRange])
  }, [timeRange])

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range)
  }

  const handleExport = (format: 'csv' | 'pdf') => {
    if (!analyticsData) return
    
    if (format === 'csv') {
      // Export as CSV
      const csvData = [
        ['Date', 'Revenue', 'Orders'],
        ...analyticsData.charts.dailyRevenue.map(d => [d.date, d.revenue, d.orders])
      ]
      const csvContent = csvData.map(row => row.join(',')).join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics-${timeRange}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      console.log('PDF export not yet implemented')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading analytics data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !analyticsData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error || 'Failed to load analytics data. Please try again later.'}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  // Transform API data to component format
  const salesData = analyticsData.charts.dailyRevenue.map(d => ({
    date: d.date,
    revenue: d.revenue,
    orders: d.orders,
    customers: 0 // Not tracked in current API
  }))

  const productPerformance = analyticsData.charts.topProducts.map(p => ({
    id: p.id,
    name: p.name,
    sales: p.quantity,
    revenue: p.revenue,
    category: 'Product' // Not provided by API yet
  }))

  const summaryData = {
    totalSales: analyticsData.summary.totalRevenue,
    totalOrders: analyticsData.summary.totalOrders,
    averageOrderValue: analyticsData.summary.averageOrderValue,
    returningCustomers: analyticsData.insights.repeatCustomers,
    conversionRate: analyticsData.summary.totalOrders > 0 
      ? ((analyticsData.summary.totalOrders / analyticsData.insights.totalCustomers) * 100)
      : 0,
    netRevenue: analyticsData.summary.totalRevenue
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header with filters */}
        <Header onTimeRangeChange={handleTimeRangeChange} onExport={handleExport} />

        {/* Summary Metrics Cards */}
        <SummaryCards data={summaryData} />

        {/* Live Visitors Widget */}
        <LiveVisitorsWidget />

        {/* Main Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <SalesChart data={salesData} />
          </div>

          <OrdersByChannelChart 
            data={analyticsData.charts.ordersByChannel || []} 
          />
          <CustomersChart 
            data={analyticsData.charts.customerGrowth || []} 
          />
        </div>

        {/* Additional Charts */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <TopProductsChart data={productPerformance} />
          </div>
          <TrafficSourcesChart 
            data={analyticsData.charts.trafficSources || []} 
          />
        </div>

        {/* Recent Orders Table */}
        <RecentOrdersTable 
          data={analyticsData.charts.recentOrders || []} 
        />

        {/* Analytics Insights */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.insights.totalProducts}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {analyticsData.insights.activeProducts} active
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.insights.lowStockProducts}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Products need restocking
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.insights.totalCustomers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {analyticsData.summary.newCustomers} new this period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Customer LTV</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${analyticsData.summary.avgCustomerLifetimeValue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Average lifetime value
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
