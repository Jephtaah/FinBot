import { CheckCircle, Upload, MessageSquare, BarChart3 } from "lucide-react"

const steps = [
  {
    name: "Sign Up & Onboard",
    description: "Create your account and tell us about your financial goals, monthly income, and expenses to personalize your experience.",
    icon: CheckCircle,
    step: "01"
  },
  {
    name: "Track Transactions",
    description: "Add expenses manually or upload receipt photos. Our AI will automatically extract and categorize transaction details.",
    icon: Upload,
    step: "02"
  },
  {
    name: "Chat with AI",
    description: "Ask your personal finance assistant questions about spending patterns, savings opportunities, and budget optimization.",
    icon: MessageSquare,
    step: "03"
  },
  {
    name: "Monitor & Improve",
    description: "View insights, track progress toward goals, and receive weekly email summaries to stay on top of your finances.",
    icon: BarChart3,
    step: "04"
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 sm:py-32 bg-gray-50 dark:bg-gray-800">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600 dark:text-blue-400">
            Simple Process
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            How FinBot Works
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            Get started with intelligent financial management in just four simple steps.
          </p>
        </div>
        
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <div className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-4">
            {steps.map((step, stepIdx) => (
              <div key={step.name} className="relative flex flex-col items-center text-center">
                {/* Step connector line */}
                {stepIdx !== steps.length - 1 && (
                  <div className="absolute top-12 left-1/2 hidden h-0.5 w-full bg-gray-200 dark:bg-gray-700 lg:block" 
                       style={{ transform: 'translateX(50%)' }} />
                )}
                
                {/* Step number and icon */}
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <step.icon className="h-8 w-8" />
                  <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-blue-600">
                    {step.step}
                  </div>
                </div>
                
                {/* Step content */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold leading-8 tracking-tight text-gray-900 dark:text-white">
                    {step.name}
                  </h3>
                  <p className="mt-2 text-base leading-7 text-gray-600 dark:text-gray-300">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
} 