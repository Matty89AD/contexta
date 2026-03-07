export type StatCardVariant = "default" | "neutral" | "active" | "completed" | "artifacts";

const variantStyles: Record<
  StatCardVariant,
  { border: string; value: string; iconBg: string }
> = {
  default: {
    border: "border-0",
    value: "text-primary",
    iconBg: "bg-primary/10 text-primary",
  },
  neutral: {
    border: "border-zinc-200 dark:border-zinc-700",
    value: "text-zinc-900 dark:text-zinc-100",
    iconBg: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
  },
  active: {
    border: "border-blue-200 dark:border-blue-800",
    value: "text-blue-700 dark:text-blue-300",
    iconBg: "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400",
  },
  completed: {
    border: "border-green-200 dark:border-green-800",
    value: "text-green-700 dark:text-green-300",
    iconBg: "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400",
  },
  artifacts: {
    border: "border-violet-200 dark:border-violet-800",
    value: "text-violet-700 dark:text-violet-300",
    iconBg: "bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-400",
  },
};

interface StatCardProps {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  variant?: StatCardVariant;
}

export function StatCard({
  value,
  label,
  description,
  icon,
  variant = "default",
}: StatCardProps) {
  const style = variantStyles[variant];
  return (
    <div
      className={`bg-card rounded-2xl p-6 relative border ${style.border}`}
    >
      {icon && (
        <div
          className={`mb-3 w-10 h-10 rounded-xl flex items-center justify-center ${style.iconBg}`}
          aria-hidden
        >
          {icon}
        </div>
      )}
      <p className={`text-3xl font-bold ${style.value}`}>{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      {description && (
        <p className="mt-2 text-xs text-muted-foreground/70">{description}</p>
      )}
    </div>
  );
}
