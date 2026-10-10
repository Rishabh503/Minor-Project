import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded-md";

    const variants = {
      primary:
        "bg-editorial-800 text-white hover:bg-editorial-700 active:bg-editorial-900 focus-visible:ring-editorial-800 shadow-sm",
      secondary:
        "bg-canvas-subtle text-editorial-800 hover:bg-canvas-muted active:bg-stone-200 border border-surface-border",
      accent:
        "bg-coral-500 text-white hover:bg-coral-600 active:bg-coral-600 focus-visible:ring-coral-500 shadow-sm",
      outline:
        "border border-surface-border bg-white text-editorial-800 hover:bg-canvas-subtle active:bg-canvas-muted",
      ghost:
        "text-editorial-800 hover:bg-canvas-subtle active:bg-canvas-muted",
      danger:
        "bg-rose-700 text-white hover:bg-rose-800 active:bg-rose-900 focus-visible:ring-rose-700",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-9 px-4 text-sm gap-2",
      lg: "h-11 px-6 text-base gap-2.5",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
