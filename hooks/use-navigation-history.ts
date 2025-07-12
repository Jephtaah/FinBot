'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

interface NavigationState {
  previousPath: string | null
  canGoBack: boolean
  sourcePage: string | null
}

const DASHBOARD_PAGES = [
  '/dashboard',
  '/dashboard/overview', 
  '/dashboard/transactions',
  '/dashboard/receipts',
  '/dashboard/chat'
] as const

const isTransactionDetailPage = (pathname: string) => {
  return pathname.match(/\/dashboard\/transactions\/[a-z0-9-]+$/) && 
         !pathname.includes('/edit') && 
         !pathname.includes('/new')
}

export function useNavigationHistory() {
  const router = useRouter()
  const pathname = usePathname()
  const [navigationState, setNavigationState] = useState<NavigationState>({
    previousPath: null,
    canGoBack: false,
    sourcePage: null
  })

  useEffect(() => {
    const storedPreviousPath = sessionStorage.getItem('previousPath')
    const storedSourcePage = sessionStorage.getItem('sourcePage')
    
    // Check if we're on a CRUD page (new/edit) or transaction detail page
    const isCrudPage = pathname.includes('/new') || 
                      pathname.includes('/edit')
    const isDetailPage = isTransactionDetailPage(pathname)
    
    if (isCrudPage || isDetailPage) {
      // We're on a CRUD page or detail page, show the stored previous path
      if (storedPreviousPath) {
        setNavigationState({
          previousPath: storedPreviousPath,
          canGoBack: true,
          sourcePage: storedSourcePage
        })
      } else {
        // Fallback to transactions if no valid previous path
        setNavigationState({
          previousPath: '/dashboard/transactions',
          canGoBack: true,
          sourcePage: null
        })
      }
    } else if (DASHBOARD_PAGES.includes(pathname as any)) {
      // We're on a main dashboard page, store it as the previous path
      sessionStorage.setItem('previousPath', pathname)
      // If we're navigating from a detail page, also store the source page
      if (storedSourcePage) {
        sessionStorage.setItem('sourcePage', pathname)
      }
      setNavigationState({
        previousPath: null,
        canGoBack: false,
        sourcePage: null
      })
    }
  }, [pathname])

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      // Update navigation state when browser navigation happens
      const currentPath = window.location.pathname
      if (DASHBOARD_PAGES.includes(currentPath as any)) {
        sessionStorage.setItem('previousPath', currentPath)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const goBack = () => {
    if (navigationState.previousPath) {
      router.push(navigationState.previousPath)
    } else {
      router.back()
    }
  }

  const getBackButtonText = () => {
    if (!navigationState.previousPath) return 'Back'
    
    switch (navigationState.previousPath) {
      case '/dashboard':
        return 'Back to Overview'
      case '/dashboard/transactions':
        return 'Back to Transactions'
      case '/dashboard/receipts':
        return 'Back to Receipts'
      case '/dashboard/chat':
        return 'Back to Chat'
      default:
        return 'Back'
    }
  }

  const setNavigationSource = (sourcePath: string) => {
    sessionStorage.setItem('previousPath', sourcePath)
    sessionStorage.setItem('sourcePage', sourcePath)
  }

  return {
    goBack,
    canGoBack: navigationState.canGoBack,
    previousPath: navigationState.previousPath,
    sourcePage: navigationState.sourcePage,
    getBackButtonText,
    setNavigationSource
  }
}