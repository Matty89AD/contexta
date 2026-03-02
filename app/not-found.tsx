import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Page not found</h1>
      <Link href="/" className="mt-4 text-zinc-600 underline hover:text-zinc-900">
        Go home
      </Link>
    </main>
  );
}
