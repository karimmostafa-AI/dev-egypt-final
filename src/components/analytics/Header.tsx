"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar, Download, Filter } from 'lucide-react'
import { TimeRange } from '@/types/analytics'

interface HeaderProps {
  onTimeRangeChange?: (range: TimeRange) => void
  onExport?: (format: 'csv' | 'pdf') => void
}

export function Header({ onTimeRangeChange, onExport }: HeaderProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30days')

  const handleTimeRangeChange = (value: TimeRange) => {
    setTimeRange(value)
    onTimeRangeChange?.(value)
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Track your store performance and insights
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={timeRange} onValueChange={handleTimeRangeChange}>
          <SelectTrigger className="w-[160px]">
            <Calendar className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="7days">Last 7 days</SelectItem>
            <SelectItem value="30days">Last 30 days</SelectItem>
            <SelectItem value="custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>

        <Select defaultValue="all-stores">
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-stores">All Stores</SelectItem>
            <SelectItem value="main">Main Store</SelectItem>
            <SelectItem value="outlet">Outlet</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          More Filters
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onExport?.('csv')}
        >
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>
    </div>
  )
}
