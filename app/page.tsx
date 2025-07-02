import { Header } from "@/components/ui/header"
import { HeroSection } from "@/components/ui/hero-section"
import { FeaturesSection } from "@/components/ui/features-section"
import { HowItWorksSection } from "@/components/ui/how-it-works-section"
import { CTASection } from "@/components/ui/cta-section"
import { Footer } from "@/components/ui/footer"

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
