import type { CSSProperties, ReactNode } from "react";
import { cn } from "../../utils/nexdo";

interface IconProps {
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  filled?: boolean;
  className?: string;
  style?: CSSProperties;
}

const sizeClass: Record<NonNullable<IconProps["size"]>, string> = {
  xs: "mat-icon-xs",
  sm: "mat-icon-sm",
  md: "mat-icon-md",
  lg: "mat-icon-lg",
  xl: "mat-icon-xl",
};

export function Icon({ name, size = "sm", filled, className, style }: IconProps): ReactNode {
  return (
    <span
      className={cn(
        "material-symbols-outlined select-none",
        sizeClass[size],
        className,
      )}
      aria-hidden="true"
      style={{
        ...style,
        ...(filled !== undefined
          ? { fontVariationSettings: `"FILL" ${filled ? 1 : 0}` }
          : {}),
      }}
    >
      {name}
    </span>
  );
}