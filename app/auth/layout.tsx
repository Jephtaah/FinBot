import { AuthHeader } from "@/components/ui/auth-header"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <AuthHeader />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
} 