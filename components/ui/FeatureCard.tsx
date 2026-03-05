import type { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-card border border-border/60 rounded-2xl p-6">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary mb-4">
        <Icon size={20} />
      </div>
      <p className="font-semibold text-foreground mb-2">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
