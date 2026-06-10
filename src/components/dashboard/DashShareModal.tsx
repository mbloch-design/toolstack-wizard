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
    `J'ai fait ma restitution stack avec ToolTrim : score ${result.healthScore}/100 et un plan d'action priorisé.`,
    `I ran my stack restitution with ToolTrim: score ${result.healthScore}/100 and a prioritized action plan.`
  );

  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  const mailUrl = `mailto:?subject=${encodeURIComponent(t("Ma restitution ToolTrim", "My ToolTrim restitution"))}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground">{t("Partager la restitution", "Share restitution")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("À utiliser si tu veux l’envoyer à un associé, un client ou ton équipe.", "Use this if you want to send it to a partner, client or team.")}
            </p>
          </div>
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
              "La synthèse partageable, le score global et les priorités. Les détails sensibles restent limités.",
              "The shareable summary, overall score and priorities. Sensitive details stay limited."
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
