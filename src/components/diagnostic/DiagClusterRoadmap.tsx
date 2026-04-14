import { useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Cluster, Tool } from "@/types/diagnostic";

interface Props {
  clusters: Cluster[];
  currentIdx: number;
  tools: Tool[];
  onGoTo: (idx: number) => void;
  t: (fr: string, en: string) => string;
}

export default function DiagClusterRoadmap({ clusters, currentIdx, tools, onGoTo, t }: Props) {
  const toolNamesByCluster = useMemo(() => {
    return clusters.map((c) => {
      const names = c.tool_ids
        .map((id) => tools.find((t) => t.id === id)?.name)
        .filter(Boolean)
        .slice(0, 4);
      return names.join(", ") + (c.tool_ids.length > 4 ? "…" : "");
    });
  }, [clusters, tools]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center justify-center gap-1.5 flex-wrap">
        {clusters.map((cluster, i) => {
          const isDone = i < currentIdx;
          const isCurrent = i === currentIdx;
          const isFuture = i > currentIdx;
          const question = cluster.question;

          return (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => i <= currentIdx && onGoTo(i)}
                  disabled={isFuture}
                  className={`rounded-full transition-all duration-200 ${
                    isDone
                      ? "w-2.5 h-2.5 bg-green-500 cursor-pointer hover:scale-125"
                      : isCurrent
                      ? "w-3.5 h-3.5 bg-primary ring-2 ring-primary/30 cursor-default"
                      : "w-2 h-2 bg-muted-foreground/30 cursor-default"
                  }`}
                  aria-label={`${t("Étape", "Step")} ${i + 1}`}
                />
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="max-w-[220px] text-xs"
              >
                <p className="font-semibold mb-0.5">
                  {t("Étape", "Step")} {i + 1} — {isDone ? "✓" : isCurrent ? "→" : "○"}
                </p>
                <p className="text-muted-foreground leading-snug">{question}</p>
                {toolNamesByCluster[i] && (
                  <p className="text-[10px] text-muted-foreground/70 mt-1 italic">
                    {toolNamesByCluster[i]}
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
