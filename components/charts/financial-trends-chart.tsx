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
      <CardHeader className="pb-4">
        <CardTitle className="text-base md:text-lg">Financial Trends</CardTitle>
        <CardDescription className="text-sm">
          Income vs expenses over the last 6 months
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <ChartContainer config={lineChartConfig} className="h-[250px] sm:h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 5,
                left: 5,
                bottom: 5,
              }}
            >
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => value.slice(0, 3)}
                interval="preserveStartEnd"
              />
              <YAxis 
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => {
                  if (value >= 1000) {
                    return `$${(value / 1000).toFixed(0)}k`
                  }
                  return `$${value}`
                }}
                width={40}
              />
              <ChartTooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background border border-border rounded-lg shadow-lg p-2 sm:p-3 max-w-[200px]">
                        <p className="font-medium text-xs sm:text-sm mb-1 sm:mb-2">{label}</p>
                        {payload.map((entry, index) => (
                          <div key={index} className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                            <div 
                              className="w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-muted-foreground truncate">{entry.name}:</span>
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
                strokeWidth={2}
                dot={{ r: 3, fill: '#22c55e', strokeWidth: 1, stroke: '#fff' }}
                activeDot={{ r: 4, fill: '#22c55e' }}
                name="Income"
              />
              <Line
                dataKey="expenses"
                type="monotone"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 3, fill: '#ef4444', strokeWidth: 1, stroke: '#fff' }}
                activeDot={{ r: 4, fill: '#ef4444' }}
                name="Expenses"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        {/* Move legend outside the chart container */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 mt-3 pt-3 border-t">
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="w-2 h-0.5 sm:w-3 sm:h-0.5 bg-green-500 rounded" />
            <span className="text-xs sm:text-sm font-medium text-green-600">Income</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="w-2 h-0.5 sm:w-3 sm:h-0.5 bg-red-500 rounded" />
            <span className="text-xs sm:text-sm font-medium text-red-600">Expenses</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 