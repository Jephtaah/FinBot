import { 
  Receipt, 
  Bot, 
  TrendingUp, 
  Camera, 
  Mail, 
  Shield,
  PieChart,
  Zap
} from "lucide-react"

const features = [
  {
    name: "Smart Receipt Scanning",
    description: "Upload receipt photos and let AI automatically extract transaction details, categories, and amounts.",
    icon: Receipt,
  },
  {
    name: "AI Financial Assistant",
    description: "Chat with your personal finance bot for insights, spending analysis, and personalized recommendations.",
    icon: Bot,
  },
  {
    name: "Expense Tracking",
    description: "Easily add, categorize, and track all your income and expenses in one organized dashboard.",
    icon: TrendingUp,
  },
  {
    name: "Instant OCR Processing",
    description: "Advanced image recognition technology that reads receipts and bills with high accuracy.",
    icon: Camera,
  },
  {
    name: "Email Summaries",
    description: "Get weekly financial summaries and spending alerts delivered straight to your inbox.",
    icon: Mail,
  },
  {
    name: "Secure & Private",
    description: "Bank-level security with encrypted data storage and privacy-first design principles.",
    icon: Shield,
  },
  {
    name: "Visual Analytics",
    description: "Beautiful charts and graphs to visualize your spending patterns and financial trends.",
    icon: PieChart,
  },
  {
    name: "Real-time Insights",
    description: "Get instant financial insights and budgeting recommendations as you spend.",
    icon: Zap,
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 sm:py-32 bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600 dark:text-blue-400">
            Everything you need
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Powerful Features for Smart Money Management
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            From AI-powered receipt scanning to personalized financial insights, FinBot provides all the tools 
            you need to take control of your finances.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.name} className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 dark:text-white">
                  <feature.icon className="h-5 w-5 flex-none text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  {feature.name}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600 dark:text-gray-300">
                  <p className="flex-auto">{feature.description}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
} 