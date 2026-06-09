import type { HTMLAttributes } from "react";

export type CardVariant = "default" | "muted";
export type CardPadding = "sm" | "md" | "lg";

const base = "rounded-lg";

// `default` = bordered surface, no shadow — deliberately avoiding the 2018
// drop-shadow card look called out in docs/design-system.md.
// `muted` = filled surface-muted, no border — for nested/secondary context.
const variants: Record<CardVariant, string> = {
  default: "border border-border bg-surface",
  muted: "bg-surface-muted",
};

const paddings: Record<CardPadding, string> = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

type CardProps = Omit<HTMLAttributes<HTMLDivElement>, "className"> & {
  variant?: CardVariant;
  padding?: CardPadding;
};

export function Card({
  variant = "default",
  padding = "md",
  ...rest
}: CardProps) {
  return (
    <div
      className={`${base} ${variants[variant]} ${paddings[padding]}`}
      {...rest}
    />
  );
}
