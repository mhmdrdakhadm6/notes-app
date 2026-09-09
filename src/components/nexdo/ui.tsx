import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/nexdo";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg" | "icon" | "icon-sm";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary-container text-on-primary-container hover:bg-accent-electric focus-visible:ring-accent-electric/70",
  secondary:
    "bg-detail-card/60 border border-border-precision bg-surface-container-lowest/60 text-text-primary hover:border-primary-container/60 hover:bg-surface-container",
  ghost:
    "bg-transparent text-text-secondary hover:bg-surface-container hover:text-text-primary",
  danger:
    "bg-priority-urgent/15 text-priority-urgent hover:bg-priority-urgent/25",
  outline:
    "border border-border-precision bg-transparent text-text-secondary hover:text-text-primary hover:border-outline-variant",
};

const sizes: Record<Size, string> = {
  sm: "h-7 px-2.5 text-label-xs gap-1.5 rounded-full",
  md: "h-9 px-4 text-label-xs gap-2 rounded-full",
  lg: "h-10 px-5 text-label-xs gap-2 rounded-full",
  icon: "h-9 w-9 rounded-full",
  "icon-sm": "h-7 w-7 rounded-full",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  label?: string;
  fullWidth?: boolean;
}

export function Button({
  variant = "secondary",
  size = "md",
  className,
  children,
  label,
  fullWidth,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex select-none items-center justify-center font-label-xs font-bold uppercase tracking-wide transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className,
      )}
      aria-label={label}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Badge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-surface-container px-2 py-0.5 font-label-xs font-semibold text-text-secondary",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function CircleAvatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-accent-gradient bg-primary-container font-label-xs font-bold text-on-primary-container ring-2 ring-primary-container/20",
        size === "sm" && "h-7 w-7",
        size === "md" && "h-9 w-9",
        size === "lg" && "h-11 w-11",
        className,
      )}
    >
      <span className="text-[10px]">{initials}</span>
    </div>
  );
}

export function ProgressBar({
  value,
  colorClass = "bg-accent-electric",
  className,
}: {
  value: number;
  colorClass?: string;
  className?: string;
}) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-container", className)}>
      <div
        className={cn("h-full rounded-full transition-all duration-500", colorClass)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}