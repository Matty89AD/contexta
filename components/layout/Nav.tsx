"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function UserCircleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="10" r="3" />
      <path d="M6.168 18.849A4 4 0 0 1 10 16h4a4 4 0 0 1 3.834 2.855" />
    </svg>
  );
}

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleSignOut = async () => {
    setOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-sm">
      <div className="w-full px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="text-base font-semibold text-foreground hover:text-foreground/80 transition"
        >
          Contexta
        </Link>

        <div className="flex items-center gap-2">
          {user ? (
            <Link
              href="/journey"
              className="hidden md:inline-flex items-center px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
            >
              Your Journey
            </Link>
          ) : (
            <Link
              href="/login"
              className="hidden md:inline-flex items-center px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
            >
              Login
            </Link>
          )}
          {pathname !== "/flow" && (
            <Link
              href="/flow"
              className="inline-flex items-center px-4 py-1.5 rounded-lg text-sm font-medium text-primary-foreground bg-primary hover:opacity-90 transition"
            >
              Start a Challenge
            </Link>
          )}

          {/* Menu pill */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label="Open menu"
              className="flex items-center gap-2 pl-3 pr-1 py-1 rounded-full border border-border bg-background hover:bg-accent transition"
            >
              {/* Hamburger lines */}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className="text-muted-foreground">
                <line x1="2" y1="4" x2="14" y2="4" />
                <line x1="2" y1="8" x2="14" y2="8" />
                <line x1="2" y1="12" x2="14" y2="12" />
              </svg>
              {/* Avatar circle */}
              <span className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition ${
                user
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground"
              }`}>
                {user ? user.email?.charAt(0).toUpperCase() : <UserCircleIcon />}
              </span>
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-border bg-background shadow-lg py-2 z-50">
                {user ? (
                  <>
                    <p className="px-4 py-2 text-xs text-muted-foreground truncate border-b border-border mb-1">
                      {user.email}
                    </p>
                    <Link
                      href="/profile"
                      onClick={() => setOpen(false)}
                      className="block px-4 py-2.5 text-sm text-foreground hover:bg-accent transition"
                    >
                      Profile
                    </Link>
                    <Link
                      href="/journey"
                      onClick={() => setOpen(false)}
                      className="block px-4 py-2.5 text-sm text-foreground hover:bg-accent transition"
                    >
                      Your Journey
                    </Link>
                    <div className="border-t border-border mt-1 mb-1" />
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-accent transition"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2.5 text-sm text-foreground hover:bg-accent transition"
                  >
                    Login
                  </Link>
                )}

                {/* Theme toggle */}
                <div className="border-t border-border mt-1 pt-2 pb-1 px-3 flex gap-1">
                  <button
                    type="button"
                    onClick={() => { if (isDark) toggleTheme(); }}
                    aria-label="Light mode"
                    className={`flex-1 flex items-center justify-center py-1.5 rounded-lg transition ${!isDark ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <SunIcon />
                  </button>
                  <button
                    type="button"
                    onClick={() => { if (!isDark) toggleTheme(); }}
                    aria-label="Dark mode"
                    className={`flex-1 flex items-center justify-center py-1.5 rounded-lg transition ${isDark ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <MoonIcon />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
