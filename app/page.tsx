import Link from "next/link";

const HOW_IT_WORKS = [
  {
    icon: "01",
    title: "Set your context",
    description:
      "Your role, stage, and experience — once, saved for next time.",
  },
  {
    icon: "02",
    title: "Describe your challenge",
    description: "In your own words. What's blocking you or your team?",
  },
  {
    icon: "03",
    title: "Get matched content",
    description:
      "Curated podcast episodes, articles, and books — instantly.",
  },
];

const EXAMPLES = [
  {
    description:
      "We have too many ideas and no clear prioritization framework",
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
    description:
      "I'm stepping into a leadership role and don't know where to start",
    domain: "leadership",
    domainLabel: "Leadership",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col dark:bg-zinc-950">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center py-24 px-6 text-center">
        <p className="text-base font-semibold text-indigo-600 dark:text-indigo-400 mb-4">
          Contexta
        </p>
        <h1 className="text-4xl font-semibold text-zinc-900 dark:text-zinc-100 max-w-xl leading-tight">
          The right PM knowledge, matched to your exact challenge.
        </h1>
        <p className="mt-4 text-xl text-zinc-500 dark:text-zinc-400 max-w-lg">
          Describe what&apos;s blocking you. Get curated podcast episodes,
          articles, and books — instantly.
        </p>
        <Link
          href="/flow"
          className="mt-8 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition"
        >
          Start your first challenge →
        </Link>
        <p className="mt-4 text-sm text-zinc-400 dark:text-zinc-500">
          No account needed · takes ~3 minutes
        </p>
      </section>

      {/* How it works */}
      <section className="bg-white dark:bg-zinc-900 border-t border-b border-zinc-200 dark:border-zinc-700 py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 text-center mb-10">
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((item) => (
              <div
                key={item.icon}
                className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-6 shadow-sm"
              >
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-3">
                  {item.icon}
                </p>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">{item.title}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Example challenges */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 text-center mb-10">
            What challenge are you facing today?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {EXAMPLES.map((ex) => (
              <Link
                key={ex.description}
                href={`/flow?description=${encodeURIComponent(ex.description)}&domains=${ex.domain}`}
                className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-5 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-md transition block"
              >
                <p className="text-zinc-900 dark:text-zinc-100 text-sm font-medium">
                  {ex.description}
                </p>
                <span className="mt-3 inline-block text-xs font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                  {ex.domainLabel}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-200 dark:border-zinc-700 py-8 text-sm text-zinc-400 dark:text-zinc-500 text-center">
        © 2026 Contexta
      </footer>
    </div>
  );
}
