export interface SalesData {
  date: string
  revenue: number
  orders: number
  customers: number
}

export interface ProductPerformance {
  id: string
  name: string
  sales: number
  revenue: number
  category: string
  imageUrl?: string
}

export interface OrdersByChannel {
  channel: string
  orders: number
  revenue: number
  percentage: number
}

export interface CustomerGrowth {
  date: string
  newCustomers: number
  returningCustomers: number
  totalCustomers: number
}

export interface TrafficSource {
  source: string
  visits: number
  conversions: number
  conversionRate: number
}

export interface RecentOrder {
  id: string
  customer: string
  total: number
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  date: string
}

export interface MetricCard {
  title: string
  value: string | number
  change: number
  changeType: 'increase' | 'decrease'
  icon: string
  trend?: number[]
}

export interface AnalyticsSummary {
  totalSales: number
  totalOrders: number
  averageOrderValue: number
  returningCustomers: number
  conversionRate: number
  netRevenue: number
}

export interface DateRange {
  from: Date
  to: Date
  label: string
}

export type TimeRange = 'today' | '7days' | '30days' | 'custom'

export interface AnalyticsFilters {
  timeRange: TimeRange
  dateRange?: DateRange
  store?: string
  channel?: string
}

export interface ChartDataPoint {
  name: string
  value: number
  [key: string]: string | number
}
