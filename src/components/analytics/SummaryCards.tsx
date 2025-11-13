"use client"

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowDown, ArrowUp, DollarSign, ShoppingCart, Users, TrendingUp, Percent, CreditCard } from 'lucide-react'
import { AnalyticsSummary } from '@/types/analytics'

interface SummaryCardsProps {
  data: AnalyticsSummary
  changes?: {
    sales: number
    orders: number
    aov: number
    customers: number
    conversion: number
    revenue: number
  }
}

export function SummaryCards({ data, changes }: SummaryCardsProps) {
  const metrics = [
    {
      title: 'Total Sales',
      value: `$${data.totalSales.toLocaleString()}`,
      change: changes?.sales || 12.5,
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      title: 'Total Orders',
      value: data.totalOrders.toLocaleString(),
      change: changes?.orders || 8.2,
      icon: ShoppingCart,
      color: 'text-blue-600',
    },
    {
      title: 'Average Order Value',
      value: `$${data.averageOrderValue.toFixed(2)}`,
      change: changes?.aov || 5.1,
      icon: CreditCard,
      color: 'text-purple-600',
    },
    {
      title: 'Returning Customers',
      value: data.returningCustomers.toLocaleString(),
      change: changes?.customers || 15.3,
      icon: Users,
      color: 'text-orange-600',
    },
    {
      title: 'Conversion Rate',
      value: `${data.conversionRate}%`,
      change: changes?.conversion || 2.4,
      icon: Percent,
      color: 'text-pink-600',
    },
    {
      title: 'Net Revenue',
      value: `$${data.netRevenue.toLocaleString()}`,
      change: changes?.revenue || 10.8,
      icon: TrendingUp,
      color: 'text-emerald-600',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {metrics.map((metric, index) => {
        const Icon = metric.icon
        const isPositive = metric.change >= 0

        return (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className="flex items-center text-xs mt-1">
                  {isPositive ? (
                    <ArrowUp className="mr-1 h-3 w-3 text-green-600" />
                  ) : (
                    <ArrowDown className="mr-1 h-3 w-3 text-red-600" />
                  )}
                  <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
                    {Math.abs(metric.change)}%
                  </span>
                  <span className="text-muted-foreground ml-1">vs last period</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
