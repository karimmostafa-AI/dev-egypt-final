"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, TrendingUp, RefreshCw } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function AdminV2AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<string>("month")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [salesChange, setSalesChange] = useState<number>(0)
  const [ordersChange, setOrdersChange] = useState<number>(0)
  const [customersChange, setCustomersChange] = useState<number>(0)
  const [avgOrderValueChange, setAvgOrderValueChange] = useState<number>(0)
  
  // Helper function to compute change color and prefix based on numeric value
  const getChangeStyle = (change: number) => {
    if (change > 0) {
      return { color: "text-green-600", prefix: "+" }
    } else if (change < 0) {
      return { color: "text-red-600", prefix: "" }
    } else {
      return { color: "text-muted-foreground", prefix: "" }
    }
  }

  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value)
    // Optionally trigger data refetch when time range changes
    fetchAnalyticsData(value)
  }

  const handleRefresh = () => {
    fetchAnalyticsData(timeRange)
  }

  const fetchAnalyticsData = async (range: string) => {
    setIsRefreshing(true)
    try {
      // Map time range values to period days
      const periodMap: { [key: string]: number } = {
        today: 1,
        week: 7,
        month: 30,
        year: 365
      }
      
      const period = periodMap[range] || 30
      
      // Fetch analytics data from the API
      const response = await fetch(`/api/admin/analytics?period=${period}`)
      if (!response.ok) {
        throw new Error("Failed to fetch analytics data")
      }
      
      const data = await response.json()
      // TODO: Update component state with fetched data
      // For now, we're just setting up the infrastructure
      console.log("Analytics data fetched:", data)
    } catch (error) {
      console.error("Error fetching analytics data:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Compute change styles for each metric
  const salesChangeStyle = getChangeStyle(salesChange)
  const ordersChangeStyle = getChangeStyle(ordersChange)
  const customersChangeStyle = getChangeStyle(customersChange)
  const avgOrderValueChangeStyle = getChangeStyle(avgOrderValueChange)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive analytics and insights for your store
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$0</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className={salesChangeStyle.color}>{salesChangeStyle.prefix}{salesChange}%</span> from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className={ordersChangeStyle.color}>{ordersChangeStyle.prefix}{ordersChange}%</span> from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className={customersChangeStyle.color}>{customersChangeStyle.prefix}{customersChange}%</span> from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$0</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className={avgOrderValueChangeStyle.color}>{avgOrderValueChangeStyle.prefix}{avgOrderValueChange}%</span> from last period
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Analytics Dashboard</CardTitle>
          <CardDescription>
            Detailed analytics and reporting features coming soon
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Advanced analytics features will be available here
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

