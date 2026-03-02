import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-semibold text-zinc-900 mb-2">Contexta</h1>
      <p className="text-zinc-600 mb-8 text-center max-w-md">
        AI-powered product management knowledge. Describe your challenge and get
        context-aware recommendations.
      </p>
      <Link
        href="/flow"
        className="rounded-lg bg-zinc-900 text-white px-6 py-3 font-medium hover:bg-zinc-800 transition"
      >
        Start with your challenge
      </Link>
    </main>
  );
}
