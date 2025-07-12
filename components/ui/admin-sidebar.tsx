'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Receipt, 
  CreditCard, 
  Users,
  Menu,
  LogOut,
  Shield
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { LogoutButton } from "@/components/logout-button"

const navigation = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    name: "Transactions",
    href: "/admin/transactions",
    icon: CreditCard,
  },
  {
    name: "Receipts",
    href: "/admin/receipts",
    icon: Receipt,
  },
]

function SidebarContent() {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Logo Section */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/admin" className="flex items-center gap-2 font-semibold">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Admin Panel
          </span>
        </Link>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 px-4 py-6">
        <nav className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href))
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

      {/* Footer Section */}
      <div className="border-t bg-muted/30 px-4 py-4">
        <nav className="space-y-2">
          <LogoutButton className="w-full justify-start text-sm font-medium h-auto py-2.5 px-3 bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-all duration-200 border-0 shadow-none">
            <LogOut className="h-4 w-4 mr-3" />
            Logout
          </LogoutButton>
        </nav>
      </div>
    </div>
  )
}

export function AdminSidebar() {
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