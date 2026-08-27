import { useState, useEffect, useRef } from "react";
import { Check } from "@/lib/icons";

interface Props {
  session: Record<string, unknown>;
  t: (fr: string, en: string) => string;
}

const LOCALSTORAGE_KEY = "diag_session_autosave";

export default function DiagSaveIndicator({ session, t }: Props) {
  const [showSaved, setShowSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      try {
        // Save session (exclude Map — convert to array)
        const serializable = {
          ...session,
          discoveryAnswers: session.discoveryAnswers instanceof Map
            ? Array.from((session.discoveryAnswers as Map<string, number>).entries())
            : session.discoveryAnswers,
        };
        localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(serializable));
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 2000);
      } catch {
        // Autosave is best-effort; private browsing or full storage can fail.
      }
    }, 2000);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [session]);

  if (!showSaved) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="rounded-lg bg-card border border-border shadow-lg px-3 py-1.5 text-xs text-muted-foreground flex items-center gap-1.5">
        <Check className="h-3.5 w-3.5 text-emerald-600" />
        {t("Enregistré", "Saved")}
      </div>
    </div>
  );
}
