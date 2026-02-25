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
import { FloatingSpheres } from '@/components/landing/floating-spheres'

export default function Home() {
  return (
    <div className="relative min-h-[100dvh] bg-[#0B0B0F]">
      <FloatingSpheres />
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
