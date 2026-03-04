import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Header() {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-6 py-4">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="text-base font-semibold text-zinc-900 dark:text-zinc-100 hover:text-zinc-700 dark:hover:text-zinc-300 transition"
        >
          Contexta
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
