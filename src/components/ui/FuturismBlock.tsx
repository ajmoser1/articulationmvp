import { cn } from "@/lib/utils";

type FuturismVariant =
  | "block-1"
  | "block-2"
  | "block-3"
  | "block-4"
  | "triangle-1"
  | "triangle-2"
  | "stripe-1"
  | "stripe-2"
  | "stripe-3";

interface FuturismBlockProps {
  variant: FuturismVariant;
  className?: string;
  zIndex?: number;
  blendMode?: "multiply" | "screen" | "overlay" | "normal";
  borderColor?: string;
}

export function FuturismBlock({
  variant,
  className,
  zIndex = 1,
  blendMode = "screen",
  borderColor,
}: FuturismBlockProps) {
  return (
    <div
      aria-hidden
      className={cn("futurism-block", `futurism-${variant}`, className)}
      style={{
        zIndex,
        mixBlendMode: blendMode,
        borderColor: borderColor ?? "transparent",
      }}
    />
  );
}
