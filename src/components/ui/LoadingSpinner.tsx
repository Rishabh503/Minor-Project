import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
}

export function LoadingSpinner({
  className,
  size = "md",
  label = "Loading...",
}: LoadingSpinnerProps) {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-10 h-10",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center p-6 gap-3", className)}>
      <Loader2
        className={cn("animate-spin text-editorial-700", sizes[size])}
        aria-hidden="true"
      />
      {label && <p className="text-xs font-medium text-brand-muted">{label}</p>}
      <span className="sr-only">{label}</span>
    </div>
  );
}
