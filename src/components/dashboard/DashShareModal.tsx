import { useState } from "react";
import type { DiagnosticResult } from "@/types/diagnostic";
import { X, Copy, Check, Linkedin, Twitter, Mail } from "lucide-react";

interface Props {
  result: DiagnosticResult;
  t: (fr: string, en: string) => string;
  onClose: () => void;
}

export default function DashShareModal({ result, t, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  // Simple share URL with session ID
  const shareUrl = `${window.location.origin}/fr/results/${result.sessionId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const shareText = t(
    `J'ai fait mon diagnostic stack sur tooltrim.com — score ${result.healthScore}/100, ${Math.round(result.estimatedWaste)}€ d'économies identifiées !`,
    `I ran my stack diagnostic on tooltrim.com — score ${result.healthScore}/100, ${Math.round(result.estimatedWaste)}€ savings identified!`
  );

  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  const mailUrl = `mailto:?subject=${encodeURIComponent(t("Mon diagnostic stack tooltrim", "My tooltrim stack diagnostic"))}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-5">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-bold text-foreground">{t("Partage ton diagnostic", "Share your diagnostic")}</h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
        </div>

        {/* Link copy */}
        <div className="flex items-center gap-2">
          <input
            id="share-report-url"
            name="share-report-url"
            readOnly
            value={shareUrl}
            className="flex-1 text-xs bg-muted rounded-lg px-3 py-2.5 text-foreground font-['DM_Mono'] truncate border-none outline-none"
          />
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? t("Copié !", "Copied!") : t("Copier", "Copy")}
          </button>
        </div>

        {/* Social share */}
        <div className="flex gap-2">
          <a
            href={linkedInUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border border-border text-foreground text-xs font-medium hover:bg-muted transition-colors"
          >
            <Linkedin className="w-3.5 h-3.5" />
            LinkedIn
          </a>
          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border border-border text-foreground text-xs font-medium hover:bg-muted transition-colors"
          >
            <Twitter className="w-3.5 h-3.5" />
            Twitter
          </a>
          <a
            href={mailUrl}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border border-border text-foreground text-xs font-medium hover:bg-muted transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            Email
          </a>
        </div>

        {/* Disclaimer */}
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong>{t("Qui verra :", "Who will see:")}</strong>{" "}
            {t(
              "Ton résumé (pas les détails), score global, 3 actions prioritaires, invitation diagnostic gratuit.",
              "Your summary (not details), overall score, 3 priority actions, free diagnostic invitation."
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
