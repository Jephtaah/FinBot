'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { 
  LayoutDashboard, 
  Receipt, 
  CreditCard, 
  User,
  Menu,
  LogOut,
  MessageSquare
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { LogoutButton } from "@/components/logout-button"

const navigation = [
  {
    name: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Transactions",
    href: "/dashboard/transactions",
    icon: CreditCard,
  },
  {
    name: "Receipts",
    href: "/dashboard/receipts",
    icon: Receipt,
  },
  {
    name: "AI Chat",
    href: "/dashboard/chat",
    icon: MessageSquare,
  },
]

const accountNavigation = [
  {
    name: "Account",
    href: "/dashboard/account",
    icon: User,
  },
]

function SidebarContent() {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Logo Section */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Image
            src="/FinBot Logo.png"
            alt="FinBot"
            width={48}
            height={48}
            className="rounded-lg"
          />
          <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            FinBot
          </span>
        </Link>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 px-4 py-6">
        <nav className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border border-blue-100" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className={cn(
                  "h-4 w-4",
                  isActive ? "text-blue-600" : ""
                )} />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Account Section */}
      <div className="border-t bg-muted/30 px-4 py-4">
        <nav className="space-y-2">
          {accountNavigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border border-blue-100" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className={cn(
                  "h-4 w-4",
                  isActive ? "text-blue-600" : ""
                )} />
                {item.name}
              </Link>
            )
          })}
          <LogoutButton className="w-full mt-2 justify-start text-sm font-medium h-auto py-2.5 px-3 bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-all duration-200 border-0 shadow-none">
            <LogOut className="h-4 w-4 mr-3" />
            Logout
          </LogoutButton>
        </nav>
      </div>
    </div>
  )
}

export function DashboardSidebar() {
  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden border-r bg-background md:block fixed left-0 top-0 h-screen w-[220px] lg:w-[280px] z-30">
        <SidebarContent />
      </div>

      {/* Mobile sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 md:hidden fixed top-4 left-4 z-50 bg-background/80 backdrop-blur-sm"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col p-0 w-[280px]">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  )
} 