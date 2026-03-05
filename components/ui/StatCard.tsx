interface StatCardProps {
  value: string;
  label: string;
  description?: string;
}

export function StatCard({ value, label, description }: StatCardProps) {
  return (
    <div className="bg-card rounded-2xl p-6 relative">
      <p className="text-3xl font-bold text-primary">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      {description && (
        <p className="mt-2 text-xs text-muted-foreground/70">{description}</p>
      )}
    </div>
  );
}
