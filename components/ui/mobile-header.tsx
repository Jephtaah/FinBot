'use client'

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { 
  Menu,
  Shield
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"

interface MobileHeaderProps {
  type: 'dashboard' | 'admin'
  children: React.ReactNode // Sidebar content
}

export function MobileHeader({ type, children }: MobileHeaderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  // Close sidebar when pathname changes (navigation occurs)
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  return (
    <div className="md:hidden">
      {/* Mobile Header Bar */}
      <div className="fixed top-0 left-0 right-0 z-40 h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between h-full px-4">
          {/* Logo */}
          <Link href={type === 'admin' ? "/admin" : "/dashboard"} className="flex items-center gap-2">
            {type === 'admin' ? (
              <>
                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                  <Shield className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Admin Panel
                </span>
              </>
            ) : (
              <>
                <Image
                  src="/FinBot Logo.png"
                  alt="FinBot"
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
                <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  FinBot
                </span>
              </>
            )}
          </Link>

          {/* Mobile Menu Button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 bg-background/80 backdrop-blur-sm"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0 w-full h-full">
              <SheetTitle className="sr-only">
                {type === 'admin' ? 'Admin Panel Navigation' : 'Dashboard Navigation'}
              </SheetTitle>
              {children}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  )
}