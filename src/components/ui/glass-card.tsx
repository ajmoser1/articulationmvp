import * as React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "interactive" | "subtle";
  hover?: boolean;
  animate?: boolean;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "default", hover = true, animate = true, children, ...props }, ref) => {
    const variantClasses = {
      default: "glass-card",
      interactive: "glass-card-interactive",
      subtle: "glass-subtle",
    };

    return (
      <div
        ref={ref}
        className={cn(
          variantClasses[variant],
          animate && "glass-entrance reveal-on-scroll",
          !hover && "hover:transform-none hover:shadow-none",
          className
        )}
        data-reveal={animate ? "true" : undefined}
        {...props}
      >
        {children}
      </div>
    );
  }
);
GlassCard.displayName = "GlassCard";

interface GlassOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean;
}

const GlassOverlay = React.forwardRef<HTMLDivElement, GlassOverlayProps>(
  ({ className, open = true, children, ...props }, ref) => {
    if (!open) return null;

    return (
      <div
        ref={ref}
        className={cn(
          "fixed inset-0 z-50 glass-overlay flex items-center justify-center",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
GlassOverlay.displayName = "GlassOverlay";

export { GlassCard, GlassOverlay };
