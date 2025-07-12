import Image from "next/image"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          {/* Logo and description */}
          <div className="space-y-8">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/FinBot Logo.png"
                alt="FinBot"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                FinBot
              </span>
            </Link>
            <p className="text-sm leading-6 text-gray-600 dark:text-gray-300">
              AI-powered personal finance management that helps you take control of your money 
              with smart insights and automated tracking.
            </p>
          </div>
          
          {/* Links */}
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-gray-900 dark:text-white">
                  Product
                </h3>
                <ul role="list" className="mt-6 space-y-4">
                  <li>
                    <Link href="#features" className="text-sm leading-6 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link href="#how-it-works" className="text-sm leading-6 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                      How it Works
                    </Link>
                  </li>
                  <li>
                    <Link href="/auth/sign-up" className="text-sm leading-6 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                      Get Started
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-gray-900 dark:text-white">
                  Account
                </h3>
                <ul role="list" className="mt-6 space-y-4">
                  <li>
                    <Link href="/auth/login" className="text-sm leading-6 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                      Sign In
                    </Link>
                  </li>
                  <li>
                    <Link href="/auth/sign-up" className="text-sm leading-6 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                      Sign Up
                    </Link>
                  </li>
                  <li>
                    <Link href="/auth/forgot-password" className="text-sm leading-6 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                      Reset Password
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-16 border-t border-gray-900/10 dark:border-gray-100/10 pt-8 sm:mt-20 lg:mt-24">
          <div className="text-center">
            <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">
              &copy; {new Date().getFullYear()} FinBot. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
} 