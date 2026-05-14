import { useState, useEffect } from "react";
import { useLang } from "@/hooks/useLang";
import { setSeoTags, setHreflang, cleanupSeo, SEO_BASE } from "@/lib/seo";
import { Mail, MessageSquare, Clock, Send, AlertCircle } from "lucide-react";

// ── Replace with your Formspree form ID (formspree.io → New Form → copy ID) ──
const FORMSPREE_ID = "xgodbpgj";

const ContactPage = () => {
  const { t, lang } = useLang();
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });

  useEffect(() => {
    const title = t("Contact — ToolTrim", "Contact — ToolTrim");
    const desc = t(
      "Contactez l'équipe ToolTrim : question, suggestion, partenariat ou correction. Nous répondons sous 48h.",
      "Contact the ToolTrim team: question, suggestion, partnership, or correction. We respond within 48h."
    );
    setSeoTags({ title, description: desc, url: `${SEO_BASE}/${lang}/contact` });
    setHreflang(`/${lang}/contact`);
    return () => cleanupSeo([]);
  }, [lang, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ...formData, _language: lang }),
      });
      if (res.ok) {
        setStatus("sent");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center py-20">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent">
            <Send className="h-7 w-7 text-primary" />
          </div>
          <h1 className="mt-6 font-display text-3xl font-bold" style={{ letterSpacing: "-0.02em" }}>
            {t("Message envoyé !", "Message sent!")}
          </h1>
          <p className="mt-3 text-muted-foreground max-w-sm mx-auto">
            {t(
              "Nous reviendrons vers vous dans les 48 heures. Merci pour votre confiance.",
              "We'll get back to you within 48 hours. Thank you for your trust."
            )}
          </p>
        </div>
      </div>
    );
  }

  const reasons = [
    {
      icon: MessageSquare,
      title: t("Question ou suggestion", "Question or suggestion"),
      desc: t("Une idée d'amélioration, un outil manquant, un bug ?", "An improvement idea, a missing tool, a bug?"),
    },
    {
      icon: Mail,
      title: t("Partenariat", "Partnership"),
      desc: t("Vous êtes un éditeur SaaS et souhaitez échanger ?", "You're a SaaS vendor and want to discuss?"),
    },
    {
      icon: Clock,
      title: t("Réponse sous 48h", "Response within 48h"),
      desc: t("Nous lisons et répondons à chaque message reçu.", "We read and respond to every message received."),
    },
  ];

  return (
    <div className="py-16 md:py-24">
      <div className="container mx-auto max-w-4xl">

        {/* Hero */}
        <div className="text-center">
          <span className="inline-block rounded-full bg-accent px-4 py-1.5 text-xs font-medium text-accent-foreground mb-6">
            Contact
          </span>
          <h1
            className="font-display font-bold tracking-tight"
            style={{ fontSize: "clamp(2rem, 5vw, 3rem)", letterSpacing: "-0.03em" }}
          >
            {t("Parlons-en", "Let's talk")}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            {t(
              "Question, suggestion ou correction — nous sommes à l'écoute.",
              "Question, suggestion, or correction — we're listening."
            )}
          </p>
        </div>

        {/* Reason cards */}
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {reasons.map((r) => (
            <div key={r.title} className="rounded-xl border border-border bg-card p-5 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                <r.icon className="h-5 w-5 text-accent-foreground" />
              </div>
              <h3 className="mt-3 text-sm font-semibold">{r.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{r.desc}</p>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="mt-12 mx-auto max-w-lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-name" className="text-sm font-medium">
                  {t("Nom", "Name")}
                </label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm transition-colors focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="text-sm font-medium">Email</label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm transition-colors focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                />
              </div>
            </div>

            <div>
              <label htmlFor="contact-subject" className="text-sm font-medium">
                {t("Sujet", "Subject")}
              </label>
              <input
                id="contact-subject"
                name="subject"
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm transition-colors focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
            </div>

            <div>
              <label htmlFor="contact-message" className="text-sm font-medium">Message</label>
              <textarea
                id="contact-message"
                name="message"
                required
                rows={5}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm transition-colors focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 resize-none"
              />
            </div>

            {/* Error state */}
            {status === "error" && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {t(
                  "Une erreur est survenue. Réessayez ou écrivez directement à contact@tooltrim.com",
                  "Something went wrong. Try again or email contact@tooltrim.com directly."
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === "sending"
                ? t("Envoi en cours…", "Sending…")
                : t("Envoyer le message →", "Send message →")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
