import { Activity, Star, TrendingUp, Zap } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'

const APP_PERKS = [
  {
    icon: <TrendingUp className="h-4 w-4 text-green-500" />,
    title: 'Smart Analytics',
    description: 'AI-powered insights for better financial decisions'
  },
  {
    icon: <Zap className="h-4 w-4 text-yellow-500" />,
    title: 'Instant Processing',
    description: 'Real-time transaction and receipt scanning'
  },
  {
    icon: <Star className="h-4 w-4 text-purple-500" />,
    title: 'Personalized Goals',
    description: 'Custom financial targets and tracking'
  }
]

export function AccountActivityCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          App Highlights
        </CardTitle>
        <CardDescription>
          Your premium features and benefits
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid gap-4">
            {APP_PERKS.map((perk, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="mt-1">{perk.icon}</div>
                <div>
                  <h5 className="font-medium">{perk.title}</h5>
                  <p className="text-sm text-muted-foreground">{perk.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 