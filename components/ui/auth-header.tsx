import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function AuthHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/FinBot Logo.png"
                alt="FinBot"
                width={40}
                height={40}
                className="rounded-lg"
              />
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                FinBot
              </span>
            </Link>
          </div>

          {/* Back to Home Button */}
          <div className="flex items-center">
            <Button variant="ghost" asChild>
              <Link href="/">
                ← Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
} 