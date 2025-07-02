'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'

interface CategoryData {
  category: string
  amount: number
  fill: string
}

interface CategoryChartProps {
  data: CategoryData[]
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{
    payload: {
      category: string
      amount: number
    }
  }>
  label?: string
}

export function CategoryChart({ data }: CategoryChartProps) {
  // If no data, show placeholder
  if (!data || data.length === 0) {
    return (
      <Card className="border border-border/50 shadow-none">
        <CardHeader>
          <CardTitle>Spending Categories</CardTitle>
          <CardDescription>
            Breakdown by category (last 3 months)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">No category data available</p>
              <p className="text-xs mt-1">Add some transactions to see breakdown</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Transform data for radar chart and normalize values
  const maxAmount = Math.max(...data.map(item => item.amount))
  const radarData = data.slice(0, 6).map(item => ({
    category: item.category,
    amount: item.amount,
    // Normalize to 0-100 scale for better radar visualization
    value: Math.round((item.amount / maxAmount) * 100)
  }))

  const radarChartConfig = {
    value: {
      label: "Amount",
      color: "#3b82f6",
    },
  }

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-sm">{data.category}</p>
          <p className="text-sm text-muted-foreground">
            ${data.amount.toLocaleString()}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="border border-border/50 shadow-none">
      <CardHeader>
        <CardTitle>Spending Categories</CardTitle>
        <CardDescription>
          Breakdown by category (last 3 months)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={radarChartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <PolarGrid 
                stroke="hsl(var(--border))" 
                strokeWidth={1}
                radialLines={true}
              />
              <PolarAngleAxis 
                dataKey="category" 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <PolarRadiusAxis 
                angle={0}
                domain={[0, 100]}
                tick={false}
                axisLine={false}
              />
              <Radar
                name="Spending"
                dataKey="value"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.3}
                strokeWidth={2}
                dot={{ r: 4, fill: '#3b82f6' }}
              />
              <ChartTooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        {/* Category breakdown list */}
        <div className="mt-4 space-y-2">
          {data.slice(0, 6).map((item) => {
            const percentage = ((item.amount / data.reduce((sum, d) => sum + d.amount, 0)) * 100).toFixed(1)
            return (
              <div key={item.category} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-muted-foreground">{item.category}</span>
                </div>
                <div className="text-right">
                  <span className="font-medium">${item.amount.toLocaleString()}</span>
                  <span className="text-muted-foreground ml-2">({percentage}%)</span>
                </div>
              </div>
            )
          })}
          {data.length > 6 && (
            <div className="text-xs text-muted-foreground text-center pt-2">
              +{data.length - 6} more categories
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 