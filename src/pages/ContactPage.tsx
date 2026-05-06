import { useState, useEffect } from "react";
import { useLang } from "@/hooks/useLang";
import { setSeoTags, setHreflang, cleanupSeo } from "@/lib/seo";
import { Mail, MessageSquare, Clock, Send } from "lucide-react";

const ContactPage = () => {
  const { t, lang } = useLang();
  const [sent, setSent] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });

  useEffect(() => {
    const title = t("Contact — ToolTrim", "Contact — ToolTrim");
    const desc = t(
      "Contactez l'équipe ToolTrim : question, suggestion, partenariat ou correction. Nous répondons sous 48h.",
      "Contact the ToolTrim team: question, suggestion, partnership, or correction. We respond within 48h."
    );
    setSeoTags({ title, description: desc, url: `https://tooltrim.com/${lang}/contact` });
    setHreflang(`/${lang}/contact`);
    return () => cleanupSeo([]);
  }, [lang]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  if (sent) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center py-20">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent">
            <Send className="h-7 w-7 text-primary" />
          </div>
          <h1 className="mt-6 font-heading text-3xl font-bold">{t("Message envoyé !", "Message sent!")}</h1>
          <p className="mt-3 text-muted-foreground max-w-sm mx-auto">
            {t("Nous reviendrons vers vous dans les 48 heures. Merci pour votre confiance.", "We'll get back to you within 48 hours. Thank you for your trust.")}
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
          <h1 className="font-heading text-4xl font-bold tracking-tight md:text-5xl">
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
                <label className="text-sm font-medium">{t("Nom", "Name")}</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm transition-colors focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm transition-colors focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">{t("Sujet", "Subject")}</label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm transition-colors focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Message</label>
              <textarea
                required
                rows={5}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm transition-colors focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 resize-none"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t("Envoyer le message →", "Send message →")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
