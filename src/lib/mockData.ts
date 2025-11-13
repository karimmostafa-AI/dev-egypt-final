import {
  SalesData,
  ProductPerformance,
  OrdersByChannel,
  CustomerGrowth,
  TrafficSource,
  RecentOrder,
  AnalyticsSummary,
} from '@/types/analytics'

// Generate sales data for the last 30 days
export const generateSalesData = (): SalesData[] => {
  const data: SalesData[] = []
  const today = new Date()
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    // Generate realistic fluctuating values
    const dayOfWeek = date.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const baseRevenue = isWeekend ? 3500 : 4200
    const variation = Math.random() * 2000 - 1000
    
    data.push({
      date: date.toISOString().split('T')[0],
      revenue: Math.round(baseRevenue + variation),
      orders: Math.round((baseRevenue + variation) / 65),
      customers: Math.round((baseRevenue + variation) / 85),
    })
  }
  
  return data
}

export const mockSalesData: SalesData[] = generateSalesData()

export const mockProductPerformance: ProductPerformance[] = [
  {
    id: '1',
    name: 'Premium Wireless Headphones',
    sales: 342,
    revenue: 51300,
    category: 'Electronics',
  },
  {
    id: '2',
    name: 'Smart Watch Pro',
    sales: 287,
    revenue: 86100,
    category: 'Electronics',
  },
  {
    id: '3',
    name: 'Designer Leather Wallet',
    sales: 456,
    revenue: 27360,
    category: 'Accessories',
  },
  {
    id: '4',
    name: 'Organic Cotton T-Shirt',
    sales: 623,
    revenue: 18690,
    category: 'Apparel',
  },
  {
    id: '5',
    name: 'Stainless Steel Water Bottle',
    sales: 534,
    revenue: 16020,
    category: 'Home & Garden',
  },
  {
    id: '6',
    name: 'Yoga Mat Premium',
    sales: 298,
    revenue: 14900,
    category: 'Sports',
  },
  {
    id: '7',
    name: 'Bluetooth Speaker Mini',
    sales: 412,
    revenue: 20600,
    category: 'Electronics',
  },
  {
    id: '8',
    name: 'Laptop Backpack',
    sales: 367,
    revenue: 22020,
    category: 'Accessories',
  },
]

export const mockOrdersByChannel: OrdersByChannel[] = [
  {
    channel: 'Online Store',
    orders: 1245,
    revenue: 156780,
    percentage: 52,
  },
  {
    channel: 'Mobile App',
    orders: 834,
    revenue: 98650,
    percentage: 28,
  },
  {
    channel: 'Social Media',
    orders: 423,
    revenue: 45230,
    percentage: 14,
  },
  {
    channel: 'Marketplace',
    orders: 198,
    revenue: 18340,
    percentage: 6,
  },
]

export const mockCustomerGrowth: CustomerGrowth[] = (() => {
  const data: CustomerGrowth[] = []
  const today = new Date()
  let totalCustomers = 5000
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    const newCustomers = Math.round(Math.random() * 50 + 20)
    const returningCustomers = Math.round(Math.random() * 80 + 40)
    totalCustomers += newCustomers
    
    data.push({
      date: date.toISOString().split('T')[0],
      newCustomers,
      returningCustomers,
      totalCustomers,
    })
  }
  
  return data
})()

export const mockTrafficSources: TrafficSource[] = [
  {
    source: 'Organic Search',
    visits: 12450,
    conversions: 623,
    conversionRate: 5.0,
  },
  {
    source: 'Direct',
    visits: 8920,
    conversions: 534,
    conversionRate: 6.0,
  },
  {
    source: 'Social Media',
    visits: 6730,
    conversions: 269,
    conversionRate: 4.0,
  },
  {
    source: 'Email Campaign',
    visits: 4560,
    conversions: 456,
    conversionRate: 10.0,
  },
  {
    source: 'Paid Ads',
    visits: 3240,
    conversions: 227,
    conversionRate: 7.0,
  },
  {
    source: 'Referral',
    visits: 2180,
    conversions: 109,
    conversionRate: 5.0,
  },
]

export const mockRecentOrders: RecentOrder[] = [
  {
    id: 'ORD-2024-1234',
    customer: 'John Smith',
    total: 234.50,
    status: 'completed',
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ORD-2024-1235',
    customer: 'Sarah Johnson',
    total: 189.99,
    status: 'processing',
    date: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ORD-2024-1236',
    customer: 'Michael Brown',
    total: 456.75,
    status: 'completed',
    date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ORD-2024-1237',
    customer: 'Emily Davis',
    total: 78.50,
    status: 'pending',
    date: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ORD-2024-1238',
    customer: 'David Wilson',
    total: 324.99,
    status: 'completed',
    date: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ORD-2024-1239',
    customer: 'Jessica Martinez',
    total: 567.25,
    status: 'processing',
    date: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ORD-2024-1240',
    customer: 'Christopher Lee',
    total: 145.80,
    status: 'completed',
    date: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ORD-2024-1241',
    customer: 'Amanda Taylor',
    total: 892.50,
    status: 'completed',
    date: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(),
  },
]

export const mockAnalyticsSummary: AnalyticsSummary = {
  totalSales: 319000,
  totalOrders: 2700,
  averageOrderValue: 118.15,
  returningCustomers: 1245,
  conversionRate: 3.8,
  netRevenue: 287100,
}

// Helper function to calculate percentage change
export const calculateChange = (current: number, previous: number): number => {
  if (previous === 0) return 0
  return ((current - previous) / previous) * 100
}

// Get summary for a specific time period
export const getSummaryForPeriod = (days: number) => {
  const recentData = mockSalesData.slice(-days)
  const previousData = mockSalesData.slice(-days * 2, -days)
  
  const currentTotal = recentData.reduce((sum, day) => sum + day.revenue, 0)
  const previousTotal = previousData.reduce((sum, day) => sum + day.revenue, 0)
  
  const currentOrders = recentData.reduce((sum, day) => sum + day.orders, 0)
  const previousOrders = previousData.reduce((sum, day) => sum + day.orders, 0)
  
  return {
    revenue: currentTotal,
    revenueChange: calculateChange(currentTotal, previousTotal),
    orders: currentOrders,
    ordersChange: calculateChange(currentOrders, previousOrders),
    avgOrderValue: currentTotal / currentOrders,
  }
}
