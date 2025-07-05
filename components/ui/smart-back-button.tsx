'use client'

import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useNavigationHistory } from '@/hooks/use-navigation-history'
import { usePathname } from 'next/navigation'

interface SmartBackButtonProps {
  className?: string
  size?: "default" | "sm" | "lg" | "icon"
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  fallbackHref?: string
  fallbackText?: string
}

export function SmartBackButton({ 
  className,
  size = "sm",
  variant = "outline",
  fallbackHref = "/dashboard/transactions",
  fallbackText = "Back to Transactions"
}: SmartBackButtonProps) {
  const { goBack, getBackButtonText, canGoBack, previousPath } = useNavigationHistory()
  const currentPath = usePathname()

  // Determine the most appropriate fallback based on current path
  const determineFallback = () => {
    // If we're on a transaction page
    if (currentPath.includes('/dashboard/transactions')) {
      return {
        href: '/dashboard/transactions',
        text: 'Back to Transactions'
      }
    }
    // If we're on a receipt page
    else if (currentPath.includes('/dashboard/receipts')) {
      return {
        href: '/dashboard/receipts',
        text: 'Back to Receipts'
      }
    }
    // Default to dashboard overview
    return {
      href: '/dashboard',
      text: 'Back to Overview'
    }
  }

  const { href, text } = determineFallback()
  const effectiveFallbackHref = fallbackHref || href
  const effectiveFallbackText = fallbackText || text

  const handleClick = () => {
    try {
      if (canGoBack) {
        goBack()
      } else {
        // Use Next.js router for client-side navigation
        window.location.href = effectiveFallbackHref
      }
    } catch (error) {
      console.error('Navigation error:', error)
      // Ultimate fallback
      window.location.href = effectiveFallbackHref
    }
  }

  const buttonText = canGoBack ? getBackButtonText() : effectiveFallbackText

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={handleClick}
      className={className}
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      {buttonText}
    </Button>
  )
}