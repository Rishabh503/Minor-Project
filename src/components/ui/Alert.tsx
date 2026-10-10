import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "success" | "warning" | "error";
  title?: string;
}

export function Alert({
  className,
  variant = "info",
  title,
  children,
  ...props
}: AlertProps) {
  const styles = {
    info: {
      box: "bg-editorial-50 border-editorial-500/20 text-editorial-900",
      icon: <Info className="w-5 h-5 text-editorial-700 shrink-0 mt-0.5" />,
    },
    success: {
      box: "bg-emerald-50 border-emerald-200 text-emerald-900",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
    },
    warning: {
      box: "bg-amber-50 border-amber-200 text-amber-900",
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
    },
    error: {
      box: "bg-rose-50 border-rose-200 text-rose-900",
      icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />,
    },
  };

  const selected = styles[variant];

  return (
    <div
      role="alert"
      className={cn(
        "flex gap-3 rounded-md border p-4 text-sm leading-relaxed",
        selected.box,
        className
      )}
      {...props}
    >
      {selected.icon}
      <div className="space-y-1">
        {title && <h5 className="font-semibold text-sm">{title}</h5>}
        <div className="text-xs leading-normal opacity-90">{children}</div>
      </div>
    </div>
  );
}
