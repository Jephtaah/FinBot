import { Button } from "@/components/ui/button"
import Link from "next/link"

export function CTASection() {
  return (
    <section className="bg-gradient-to-r from-blue-600 to-purple-600">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
            Ready to Transform Your Financial Life?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-blue-100 sm:mt-6 sm:text-lg sm:leading-8">
            Join thousands of users who have already taken control of their finances with FinBot&apos;s 
            intelligent money management platform.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:mt-10 sm:flex-row sm:gap-6">
            <Button 
              asChild 
              size="lg" 
              className="w-full bg-white text-blue-600 hover:bg-gray-50 hover:text-blue-700 sm:w-auto"
            >
              <Link href="/auth/sign-up">
                Start Your Free Account
              </Link>
            </Button>
            <Button 
              variant="link" 
              size="lg" 
              className="w-full text-white hover:text-blue-100 sm:w-auto"
              asChild
            >
              <Link href="/auth/login">
                Already have an account? Sign in →
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
} 