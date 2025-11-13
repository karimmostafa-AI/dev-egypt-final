"use client"

import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { OrdersByChannel } from '@/types/analytics'

interface OrdersByChannelChartProps {
  data: OrdersByChannel[]
}

const COLORS = ['hsl(var(--primary))', 'hsl(142, 76%, 36%)', 'hsl(24, 95%, 53%)', 'hsl(280, 82%, 60%)']

export function OrdersByChannelChart({ data }: OrdersByChannelChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Orders by Channel</CardTitle>
          <CardDescription>Sales distribution across channels</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ channel, percentage }) => `${channel}: ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="orders"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {data.map((item, index) => (
              <div key={item.channel} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span>{item.channel}</span>
                </div>
                <div className="flex gap-4 text-muted-foreground">
                  <span>{item.orders} orders</span>
                  <span className="font-medium">${item.revenue.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
