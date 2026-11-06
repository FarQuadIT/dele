import { HeroSection } from "@/components/landing/hero/hero-section";
import { ProblemsSection } from "@/components/landing/problems-section";
import { DigitalProfileSection } from "@/components/landing/digital-profile-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { UseCasesSection } from "@/components/landing/use-cases-section";
import { WorkControlSection } from "@/components/landing/work-control-section";
import { SubscriptionSection } from "@/components/landing/subscription-section";
import { CompaniesSection } from "@/components/landing/companies-section";
import { SecuritySection } from "@/components/landing/security-section";
import { FaqSection } from "@/components/landing/faq-section";
import { FinalCtaSection } from "@/components/landing/final-cta-section";
import { MobileCta } from "@/components/public/mobile-cta";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      <HeroSection />
      <ProblemsSection />
      <DigitalProfileSection />
      <HowItWorksSection />
      <UseCasesSection />
      <WorkControlSection />
      <SubscriptionSection />
      <CompaniesSection />
      <SecuritySection />
      <FaqSection />
      <FinalCtaSection />
      <MobileCta />
    </main>
  );
}
