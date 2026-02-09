import { useState } from "react";
import { cn } from "@/lib/utils";

export type FillerTier = "large" | "medium" | "small";

type SpecificFiller = { word: string; count: number };

interface FillerCategoryCardProps {
  categoryName: string;
  count: number;
  percentage: number;
  tier: FillerTier;
  specificFillers: SpecificFiller[];
  description: string;
  whyUsed: string;
  usageInsight: string;
  color: string;
}

export function FillerCategoryCard({
  categoryName,
  count,
  percentage,
  tier,
  specificFillers,
  description,
  whyUsed,
  usageInsight,
  color,
}: FillerCategoryCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn("filler-card glass-card", expanded && "is-expanded")}
      data-tier={tier}
      style={{ borderLeftColor: color }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      onClick={() => setExpanded((prev) => !prev)}
      role="button"
      aria-expanded={expanded}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setExpanded((prev) => !prev);
        }
      }}
    >
      <div className="filler-card-header">
        <div>
          <h3 className="text-xl font-serif font-semibold text-foreground">
            {categoryName}
          </h3>
          <p className="text-sm text-muted-foreground font-sans">
            {percentage.toFixed(0)}% of total fillers
          </p>
        </div>
        <div className="text-3xl font-serif font-bold text-foreground tabular-nums">
          {count}
        </div>
      </div>

      <div className="filler-card-details">
        <div className="filler-chip-row">
          {specificFillers.length === 0 ? (
            <span className="text-sm text-muted-foreground font-sans">
              No instances detected
            </span>
          ) : (
            specificFillers.map((filler) => (
              <span key={filler.word} className="filler-chip">
                {filler.word} ({filler.count})
              </span>
            ))
          )}
        </div>
      </div>

      <div className="filler-card-info">
        <p className="text-sm text-foreground font-sans">{description}</p>
        <p className="text-sm text-muted-foreground font-sans">{whyUsed}</p>
        <p className="text-sm text-muted-foreground font-sans italic">
          {usageInsight}
        </p>
      </div>
    </div>
  );
}
