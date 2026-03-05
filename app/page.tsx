import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { ArrowRight, BrainCircuit, GraduationCap, Trophy, Zap } from "lucide-react";
import { CTAButton } from "@/components/ui/CTAButton";
import { StatCard } from "@/components/ui/StatCard";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { StepCard } from "@/components/ui/StepCard";
import { SectionHeader } from "@/components/layout/SectionHeader";

const STATS = [
  { value: "50+", label: "PM Artifacts" },
  { value: "999+", label: "Content Sources" },
  { value: "400+", label: "Thought Leaders" },
  { value: "6+", label: "All PM Domains Covered" },
];

const FEATURES = [
  {
    icon: BrainCircuit,
    title: "Experience-based matching",
    description: "Get PM Artifacts matched to your challenge based on your role, stage, and experience level.",
  },
  {
    icon: GraduationCap,
    title: "Learn new skills",
    description: "Discover frameworks and playbooks curated to help you grow in your exact situation.",
  },
  {
    icon: Trophy,
    title: "Top thought leaders",
    description: "See your top ranked thought leaders ranked for your challenge and learn from them.",
  },
];

const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Set your context",
    description: "Your role, stage, and experience — once, saved for next time.",
  },
  {
    step: 2,
    title: "Describe your challenge",
    description: "In your own words. What's blocking you or your team?",
  },
  {
    step: 3,
    title: "Get matched content",
    description: "Curated podcast episodes, articles, and books — instantly.",
  },
];

const EXAMPLES = [
  {
    description: "We have too many ideas and no clear prioritization framework",
    domain: "strategy",
    domainLabel: "Strategy",
  },
  {
    description: "I struggle to align stakeholders on the roadmap",
    domain: "strategy",
    domainLabel: "Strategy",
  },
  {
    description: "Our team ships fast but rarely acts on user feedback",
    domain: "discovery",
    domainLabel: "Discovery",
  },
  {
    description: "I'm stepping into a leadership role and don't know where to start",
    domain: "leadership",
    domainLabel: "Leadership",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center py-24 px-6 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-xs font-medium mb-6">
          <Zap size={14} />
          <span>Now with 50+ PM Artifacts</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight bg-gradient-to-b from-gray-500 to-black bg-clip-text text-transparent leading-tight">
          Everything you need <br />to grow as a Product Manager
        </h1>
        <p className="mt-6 text-xl text-muted-foreground max-w-lg">
          Share what&apos;s blocking you. <br /> Get curated PM Artifacts — the most relevant frameworks,
          principles, and real-world playbooks from the best product leaders.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <CTAButton href="/flow" variant="primary">
            Start your first challenge →
          </CTAButton>
          <CTAButton href="#how-it-works" variant="secondary">
            How it works
          </CTAButton>
        </div>
        <p className="mt-6 text-sm text-muted-foreground max-w-lg">
          No account needed. Get your first PM Artifacts in under 3 minutes.
        </p>
      </section>

      {/* Metrics Strip */}
      <section className="px-6 py-10 border-t border-border/60">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((stat) => (
            <StatCard key={stat.label} value={stat.value} label={stat.label} />
          ))}
        </div>
      </section>

      {/* Feature Grid */}
      <section className="px-6 py-16 bg-surface-1">
        <div className="max-w-6xl mx-auto">
          <SectionHeader
            title="Everything you need to grow as a Product Manager"
            subtitle="Contexta matches you to the right PM Artifacts at the right time."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <FeatureCard key={f.title} icon={f.icon} title={f.title} description={f.description} />
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-6 py-16 border-t border-border/60">
        <div className="max-w-6xl mx-auto">
          <SectionHeader title="How it works" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {HOW_IT_WORKS.map((item) => (
              <StepCard key={item.step} step={item.step} title={item.title} description={item.description} />
            ))}
          </div>
        </div>
      </section>

      {/* Example challenges */}
      <section className="px-6 py-16 bg-surface-1 border-t border-border/60">
        <div className="max-w-6xl mx-auto">
          <SectionHeader title="What challenge are you facing today?" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {EXAMPLES.map((ex) => (
              <Link
                key={ex.description}
                href={`/flow?description=${encodeURIComponent(ex.description)}&domains=${ex.domain}`}
                className="bg-card border border-border/60 rounded-2xl p-5 hover:border-primary/40 hover:shadow-md transition block group"
              >
                <p className="text-foreground text-sm font-medium group-hover:text-primary transition">
                  {ex.description}
                </p>
                <span className="mt-3 inline-block text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {ex.domainLabel}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      {/* CTA Banner */}
      <section className="px-6 py-16 border-t border-border/60">
        <div className="max-w-6xl mx-auto">
          <div className="p-12 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
            <div className="relative z-10 text-center">
              <h2 className="text-4xl font-bold text-white mb-6">Ready to solve your next challenge?</h2>
              <p className="text-indigo-100 mb-8 max-w-xl mx-auto opacity-90">
                Join the movement of Product Managers who use Contexta to navigate complex product decisions.
              </p>
              <Link
                href="/flow"
                className="bg-white text-indigo-600 px-8 py-4 rounded-full font-bold hover:scale-105 transition-transform inline-flex items-center gap-2 shadow-xl"
              >
                Get Started Now <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
