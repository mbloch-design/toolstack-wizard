import { useEffect, useState } from "react";
import { Search } from "lucide-react";

interface Props {
  message: string;
  toolCount: number;
  onComplete: () => void;
  t: (fr: string, en: string) => string;
}

export default function DiagTransitionOverlay({ message, toolCount, onComplete, t }: Props) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return p + 4;
      });
    }, 60); // ~1.5s total

    const timer = setTimeout(onComplete, 1500);
    return () => { clearInterval(interval); clearTimeout(timer); };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center">
      <div className="text-center space-y-6 max-w-sm px-4">
        <div className="animate-pulse">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <Search className="h-7 w-7 text-primary" />
          </div>
        </div>
        <p className="text-lg font-semibold text-foreground">{message}</p>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        {toolCount > 0 && (
          <p className="text-sm text-muted-foreground">
            {t(
              `${toolCount} outil${toolCount > 1 ? "s" : ""} à analyser...`,
              `${toolCount} tool${toolCount > 1 ? "s" : ""} to analyze...`
            )}
          </p>
        )}
      </div>
    </div>
  );
}
