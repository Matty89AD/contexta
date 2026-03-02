import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-semibold text-zinc-900 mb-4">Sign in</h1>
      <p className="text-zinc-600 text-center max-w-sm mb-6">
        Configure Supabase Auth (email/password and Google) in your project
        dashboard. Then add sign-in UI here or use Supabase Auth components.
      </p>
      <Link
        href="/flow"
        className="text-zinc-600 underline hover:text-zinc-900"
      >
        Back to flow
      </Link>
    </main>
  );
}
