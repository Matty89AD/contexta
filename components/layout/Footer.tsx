import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border/60 py-10 px-6 mt-auto">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">Product</p>
            <ul className="space-y-2">
              <li>
                <Link href="/flow" className="text-sm text-muted-foreground hover:text-foreground transition">
                  Start a Challenge
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition">
                  How it works
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">About</p>
            <ul className="space-y-2">
              <li>
                <a href="/presentation.html" className="text-sm text-muted-foreground hover:text-foreground transition">
                  MVP Presentation
                </a>
              </li>
              <li>
                <a href="/matching-logic.html" className="text-sm text-muted-foreground hover:text-foreground transition">
                  Matching Logic
                </a>
              </li>
            </ul>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">© 2026 Contexta</p>
      </div>
    </footer>
  );
}
