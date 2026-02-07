import { cn } from "@/lib/utils";

export type WatercolorPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "center-top"
  | "center";

export type WatercolorColor = "terracotta" | "amber" | "burgundy";

const POSITION_CLASSES: Record<WatercolorPosition, string> = {
  "top-left": "top-0 left-0 -translate-x-1/2 -translate-y-1/2",
  "top-right": "top-0 right-0 translate-x-1/2 -translate-y-1/2",
  "bottom-left": "bottom-0 left-0 -translate-x-1/2 translate-y-1/2",
  "bottom-right": "bottom-0 right-0 translate-x-1/2 translate-y-1/2",
  "center-top": "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2",
  center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
};

/** rgba values for soft radial gradients - very low opacity */
const COLOR_GRADIENTS: Record<WatercolorColor, string> = {
  terracotta:
    "radial-gradient(ellipse 55% 55% at 30% 50%, rgba(198, 123, 92, 0.12) 0%, transparent 60%)",
  amber:
    "radial-gradient(ellipse 55% 55% at 50% 40%, rgba(184, 134, 11, 0.1) 0%, transparent 60%)",
  burgundy:
    "radial-gradient(ellipse 55% 55% at 50% 30%, rgba(160, 56, 78, 0.1) 0%, transparent 60%)",
};

interface WatercolorBlobProps {
  position?: WatercolorPosition;
  color?: WatercolorColor;
  className?: string;
  /** Diameter in px; default 500 */
  size?: number;
}

/**
 * Decorative watercolor-style blob. Renders behind content (z-index 0),
 * pointer-events: none. Use for subtle warmth, not as a focal point.
 */
export function WatercolorBlob({
  position = "bottom-right",
  color = "terracotta",
  className,
  size = 500,
}: WatercolorBlobProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "absolute pointer-events-none select-none",
        "rounded-[60%_40%_30%_70%_/_60%_30%_70%_40%]",
        POSITION_CLASSES[position],
        className
      )}
      style={{
        width: size,
        height: size,
        background: COLOR_GRADIENTS[color],
        zIndex: 0,
      }}
    />
  );
}
