import type { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  cta?: ReactNode;
}

export function SectionHeader({ title, subtitle, cta }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-10">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {cta && <div className="flex-shrink-0">{cta}</div>}
    </div>
  );
}
