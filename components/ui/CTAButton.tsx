import Link from "next/link";
import type { ReactNode } from "react";

interface CTAButtonProps {
  href: string;
  variant?: "primary" | "secondary";
  children: ReactNode;
}

export function CTAButton({ href, variant = "primary", children }: CTAButtonProps) {
  if (variant === "primary") {
    return (
      <Link
        href={href}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
      >
        {children}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium border border-border bg-transparent text-foreground hover:bg-accent transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
    </Link>
  );
}
