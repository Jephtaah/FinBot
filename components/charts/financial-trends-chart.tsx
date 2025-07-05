'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  ResponsiveContainer
} from 'recharts'

interface ChartData {
  month: string
  income: number
  expenses: number
  net: number
}

interface FinancialTrendsChartProps {
  data: ChartData[]
}

const lineChartConfig = {
  income: {
    label: "Income",
    color: "#22c55e",
  },
  expenses: {
    label: "Expenses", 
    color: "#ef4444",
  },
}

export function FinancialTrendsChart({ data }: FinancialTrendsChartProps) {
  // If no data, show placeholder
  if (!data || data.length === 0) {
    return (
      <Card className="border border-border/50 shadow-none">
        <CardHeader>
          <CardTitle>Financial Trends</CardTitle>
          <CardDescription>
            Income vs expenses over the last 6 months
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">No transaction data available</p>
              <p className="text-xs mt-1">Add some transactions to see trends</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-border/50 shadow-none">
      <CardHeader>
        <CardTitle>Financial Trends</CardTitle>
        <CardDescription>
          Income vs expenses over the last 6 months
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <ChartContainer config={lineChartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 10,
                left: 10,
                bottom: 5,
              }}
            >
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <YAxis 
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <ChartTooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
                        <p className="font-medium text-sm mb-2">{label}</p>
                        {payload.map((entry, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-muted-foreground">{entry.name}:</span>
                            <span className="font-medium">${entry.value?.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Line
                dataKey="income"
                type="monotone"
                stroke="#22c55e"
                strokeWidth={3}
                dot={{ r: 4, fill: '#22c55e', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, fill: '#22c55e' }}
                name="Income"
              />
              <Line
                dataKey="expenses"
                type="monotone"
                stroke="#ef4444"
                strokeWidth={3}
                dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, fill: '#ef4444' }}
                name="Expenses"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        {/* Move legend outside the chart container */}
        <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-green-500 rounded" />
            <span className="text-sm font-medium text-green-600">Income</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-red-500 rounded" />
            <span className="text-sm font-medium text-red-600">Expenses</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 