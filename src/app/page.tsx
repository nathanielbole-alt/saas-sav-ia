import { Navbar } from '@/components/landing/navbar'
import { Hero } from '@/components/landing/hero'
import { Problems } from '@/components/landing/problems'
import { Features } from '@/components/landing/features'
import { HowItWorks } from '@/components/landing/how-it-works'
import { Testimonials } from '@/components/landing/testimonials'
import { Pricing } from '@/components/landing/pricing'
import { FAQ } from '@/components/landing/faq'
import { UseCases } from '@/components/landing/use-cases'
import { Footer } from '@/components/landing/footer'

export default function Home() {
  return (
    <div className="min-h-screen bg-[#09090b]">
      <Navbar />
      <Hero />
      <Problems />
      <Features />
      <UseCases />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <FAQ />
      <Footer />
    </div>
  )
}
