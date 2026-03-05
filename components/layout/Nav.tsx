"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="text-base font-semibold text-foreground hover:text-foreground/80 transition"
        >
          Contexta
        </Link>

        {/* Desktop right side */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          {pathname !== "/flow" && (
            <Link
              href="/flow"
              className="inline-flex items-center px-4 py-1.5 rounded-lg text-sm font-medium text-primary-foreground bg-primary hover:opacity-90 transition"
            >
              Start a Challenge
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Open menu"
                className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-accent transition"
              >
                <Menu size={18} />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <nav className="flex flex-col gap-4 mt-8">
                <Link
                  href="/"
                  className="text-sm font-medium text-foreground hover:text-primary transition"
                >
                  Home
                </Link>
                <Link
                  href="/flow"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium text-primary-foreground bg-primary hover:opacity-90 transition"
                >
                  Start a Challenge
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
