import { ChatDemoSection } from "@/components/ChatDemo";
import { FAQ } from "@/components/FAQ";
import { Features } from "@/components/Features";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { IndustryCarousel } from "@/components/IndustryCarousel";
import { Navbar } from "@/components/Navbar";
import { Pricing } from "@/components/Pricing";
import { Security } from "@/components/Security";
import { Stats } from "@/components/Stats";
import { Testimonials } from "@/components/Testimonials";

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#080810] text-[#F0EEE9] selection:bg-[#7c3aed]/30">
      <Navbar />
      <Hero />
      <Stats />
      <ChatDemoSection />
      <HowItWorks />
      <Features />
      <IndustryCarousel />
      <Testimonials />
      <Pricing />
      <Security />
      <FAQ />
      <Footer />
    </main>
  );
}
