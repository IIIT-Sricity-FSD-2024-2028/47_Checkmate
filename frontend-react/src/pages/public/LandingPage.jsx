import Navbar from "../../components/public/Navbar";
import Hero from "../../components/public/Hero";
import Features from "../../components/public/Features";
import HowItWorks from "../../components/public/HowItWorks";
import Stats from "../../components/public/Stats";
import Events from "../../components/public/Events";
import CallToAction from "../../components/public/CallToAction";
import FinalHero from "../../components/public/FinalHero";
import Footer from "../../components/public/Footer";

export default function LandingPage() {
  return (
    <div className="landing-page">
      <Navbar />

      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Stats />
        <Events />
        <CallToAction />
        <FinalHero />
      </main>

      <Footer />
    </div>
  );
}