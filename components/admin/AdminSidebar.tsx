"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/news", label: "News Posts" },
  { href: "/admin/sources", label: "Content Sources" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-52 shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex flex-col gap-1">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mb-3 px-2">
        Admin
      </p>
      {NAV_ITEMS.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : (pathname ?? "").startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </aside>
  );
}
