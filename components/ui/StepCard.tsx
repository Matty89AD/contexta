interface StepCardProps {
  step: number;
  title: string;
  description: string;
}

export function StepCard({ step, title, description }: StepCardProps) {
  return (
    <div className="bg-card border border-border/60 rounded-2xl p-6 relative">
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4">
        {String(step).padStart(2, "0")}
      </span>
      <p className="font-semibold text-foreground mb-2">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
