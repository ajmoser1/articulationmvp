import { cn } from "@/lib/utils";

export type WatercolorPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "center-top"
  | "center";

/** Multi-color gradient schemes using futuristic palette */
export type WatercolorColorScheme =
  | "purple-pink"
  | "blue-cyan"
  | "green-purple"
  | "blue-pink"
  | "celebration"
  | "rainbow";

const POSITION_CLASSES: Record<WatercolorPosition, string> = {
  "top-left": "top-0 left-0 -translate-x-1/2 -translate-y-1/2",
  "top-right": "top-0 right-0 translate-x-1/2 -translate-y-1/2",
  "bottom-left": "bottom-0 left-0 -translate-x-1/2 translate-y-1/2",
  "bottom-right": "bottom-0 right-0 translate-x-1/2 translate-y-1/2",
  "center-top": "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2",
  center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
};

/** Futuristic color gradients - multi-stop radial with 0.08-0.16 opacity */
const COLOR_SCHEMES: Record<WatercolorColorScheme, string> = {
  "purple-pink":
    "radial-gradient(ellipse 55% 55% at 30% 50%, rgba(114, 9, 183, 0.12) 0%, rgba(247, 37, 133, 0.10) 40%, transparent 70%)",
  "blue-cyan":
    "radial-gradient(ellipse 55% 55% at 40% 50%, rgba(76, 201, 240, 0.15) 0%, rgba(6, 255, 165, 0.12) 45%, transparent 70%)",
  "green-purple":
    "radial-gradient(ellipse 55% 55% at 50% 40%, rgba(6, 255, 165, 0.12) 0%, rgba(74, 222, 128, 0.10) 35%, rgba(114, 9, 183, 0.08) 60%, transparent 75%)",
  "blue-pink":
    "radial-gradient(ellipse 55% 55% at 50% 40%, rgba(76, 201, 240, 0.15) 0%, rgba(247, 37, 133, 0.10) 45%, transparent 70%)",
  celebration:
    "radial-gradient(ellipse 60% 60% at 50% 30%, rgba(114, 9, 183, 0.16) 0%, rgba(247, 37, 133, 0.14) 30%, rgba(76, 201, 240, 0.12) 55%, transparent 75%)",
  rainbow:
    "radial-gradient(ellipse 55% 55% at 30% 40%, rgba(247, 37, 133, 0.12) 0%, rgba(114, 9, 183, 0.10) 25%, rgba(76, 201, 240, 0.10) 45%, rgba(6, 255, 165, 0.10) 60%, rgba(74, 222, 128, 0.08) 75%, transparent 85%)",
};

interface WatercolorBlobProps {
  position?: WatercolorPosition;
  colorScheme?: WatercolorColorScheme;
  className?: string;
  /** Diameter in px; 400-800 range */
  size?: number;
  /** Enable slow rotation/pulse animation (20-30s) */
  animate?: boolean;
}

/**
 * Decorative watercolor-style blob with futuristic colors.
 * Renders behind content (z-index 0), pointer-events: none.
 */
export function WatercolorBlob({
  position = "bottom-right",
  colorScheme = "purple-pink",
  className,
  size = 550,
  animate = true,
}: WatercolorBlobProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "absolute pointer-events-none select-none",
        POSITION_CLASSES[position],
        className
      )}
      style={{ width: size, height: size, zIndex: 0 }}
    >
      <div className="watercolor-parallax w-full h-full">
        <div
          className={cn(
            "watercolor-blob-inner w-full h-full rounded-[60%_40%_30%_70%_/_60%_30%_70%_40%]",
            animate && "animate-watercolor-float"
          )}
          style={{
            background: COLOR_SCHEMES[colorScheme],
            mixBlendMode: "screen",
            willChange: animate ? "transform" : undefined,
          }}
        />
      </div>
    </div>
  );
}
