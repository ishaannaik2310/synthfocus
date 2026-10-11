import { LandingNav } from "@/components/landing/LandingNav";
import { LandingHero } from "@/components/landing/LandingHero";
import { FactStripSection } from "@/components/landing/FactStripSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { SampleResultSection } from "@/components/landing/SampleResultSection";
import { FinalCtaSection } from "@/components/landing/FinalCtaSection";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#133ee8] text-white selection:bg-[#ffe500] selection:text-black">
      <LandingNav />
      <LandingHero />
      <FactStripSection />
      <HowItWorksSection />
      <SampleResultSection />
      <FinalCtaSection />
      <LandingFooter />
    </main>
  );
}
