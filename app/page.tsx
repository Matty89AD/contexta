import Link from "next/link";
import { BrainCircuit, GraduationCap, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CTAButton } from "@/components/ui/CTAButton";
import { StatCard } from "@/components/ui/StatCard";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { StepCard } from "@/components/ui/StepCard";
import { SectionHeader } from "@/components/layout/SectionHeader";

const STATS = [
  { value: "150+", label: "PM Artifacts" },
  { value: "20+", label: "Content Sources" },
  { value: "30+", label: "Thought Leaders" },
  { value: "6", label: "PM Domains" },
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
        <h1 className="text-4xl font-semibold text-foreground max-w-xl leading-tight">
          The right Product Management knowledge, matched to your exact challenge.
        </h1>
        <p className="mt-6 text-xl text-muted-foreground max-w-lg">
          Share what&apos;s blocking you. Get curated PM-Artifacts — the most relevant frameworks,
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
        <div className="mt-5 flex items-center gap-3">
          <Badge variant="secondary">No account needed</Badge>
          <Badge variant="secondary">~3 minutes</Badge>
        </div>
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
            title="Everything you need to grow as a PM"
            subtitle="Contexta matches you to the right knowledge at the right time."
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
    </div>
  );
}
