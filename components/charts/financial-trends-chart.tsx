'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  ResponsiveContainer,
  Legend 
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
      <CardContent>
        <ChartContainer config={lineChartConfig} className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60,
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
              <Legend 
                verticalAlign="bottom" 
                height={36}
                iconType="line"
                formatter={(value, entry) => (
                  <span style={{ color: entry.color, fontSize: '14px', fontWeight: '500' }}>
                    {value}
                  </span>
                )}
                wrapperStyle={{
                  paddingTop: '20px'
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
      </CardContent>
    </Card>
  )
} 