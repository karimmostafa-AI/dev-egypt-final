"use client"

import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrafficSource } from '@/types/analytics'
import { Progress } from '@/components/ui/progress'

interface TrafficSourcesChartProps {
  data: TrafficSource[]
}

export function TrafficSourcesChart({ data }: TrafficSourcesChartProps) {
  const maxVisits = Math.max(...data.map(item => item.visits))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Traffic Sources</CardTitle>
          <CardDescription>Visitors and conversions by source</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.map((source, index) => (
              <div key={source.source} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{source.source}</span>
                  <div className="flex gap-4 text-muted-foreground">
                    <span>{source.visits.toLocaleString()} visits</span>
                    <span className="text-green-600">{source.conversionRate}% CVR</span>
                  </div>
                </div>
                <Progress value={(source.visits / maxVisits) * 100} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{source.conversions} conversions</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
