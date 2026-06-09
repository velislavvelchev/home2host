import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium " +
  "transition-colors duration-base ease-standard " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-800 text-neutral-0 shadow-1 hover:bg-brand-700 active:bg-brand-900 " +
    "dark:bg-brand-600 dark:hover:bg-brand-500 dark:active:bg-brand-700",
  secondary:
    "border border-border bg-surface text-foreground hover:bg-surface-muted",
  ghost:
    "bg-transparent text-foreground hover:bg-surface-muted",
};

// sm reserved for desktop-dense UIs; md is the mobile default (40px tap target).
const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export function buttonStyles(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
): string {
  return `${base} ${variants[variant]} ${sizes[size]}`;
}

type ButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "className"
> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  variant = "primary",
  size = "md",
  type = "button",
  ...rest
}: ButtonProps) {
  return <button type={type} className={buttonStyles(variant, size)} {...rest} />;
}
