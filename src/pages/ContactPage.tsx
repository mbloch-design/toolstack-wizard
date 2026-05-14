import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useForm, ValidationError } from "@formspree/react";
import { useLang } from "@/hooks/useLang";
import { setSeoTags, setHreflang, cleanupSeo, SEO_BASE } from "@/lib/seo";
import { Mail, MessageSquare, Clock, ArrowRight, AlertCircle } from "lucide-react";

const ContactPage = () => {
  const { t, lang, prefix } = useLang();
  const [state, handleSubmit] = useForm("xgodbpgj");

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

  const inputClass =
    "mt-1.5 w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-all duration-150";

  const reasons = [
    {
      icon: MessageSquare,
      title: t("Question ou suggestion", "Question or suggestion"),
      desc: t("Idée d'amélioration, outil manquant, bug ?", "Improvement idea, missing tool, bug?"),
    },
    {
      icon: Mail,
      title: t("Partenariat éditeur", "Vendor partnership"),
      desc: t("Vous éditez un SaaS et voulez échanger.", "You publish a SaaS and want to talk."),
    },
    {
      icon: Clock,
      title: t("Réponse sous 48h", "Response within 48h"),
      desc: t("Chaque message est lu et traité.", "Every message is read and handled."),
    },
  ];

  // ── Success screen ──────────────────────────────────────────────────────────
  if (state.succeeded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center py-20">
        <div className="text-center">
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: "#dcfce7" }}
          >
            <ArrowRight className="h-7 w-7" style={{ color: "#15803d" }} />
          </div>
          <h1
            className="mt-6 font-display font-bold"
            style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", letterSpacing: "-0.025em" }}
          >
            {t("Message envoyé !", "Message sent!")}
          </h1>
          <p className="mt-3 max-w-sm mx-auto" style={{ fontSize: "0.9375rem", color: "hsl(var(--muted-foreground))" }}>
            {t(
              "Nous reviendrons vers vous dans les 48 heures.",
              "We'll get back to you within 48 hours."
            )}
          </p>
          <Link
            to={`${prefix}/tools`}
            className="mt-6 inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
            style={{ background: "hsl(var(--foreground))", color: "hsl(var(--background))" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(var(--foreground) / 0.85)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(var(--foreground))"; }}
          >
            {t("Explorer les outils", "Explore tools")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--background))" }}>

      {/* ── Hero — même langage que ToolsPage / CategoryPage ─────────────────── */}
      <section
        className="relative overflow-hidden border-b border-border"
        style={{ background: "hsl(230 40% 97%)" }}
      >
        <div className="mx-auto max-w-7xl px-6 py-12">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5" aria-label="Breadcrumb">
            <Link
              to={`${prefix}`}
              className="text-[11px] font-medium transition-colors hover:text-foreground"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              {t("Accueil", "Home")}
            </Link>
            <span className="text-[11px]" style={{ color: "hsl(var(--muted-foreground) / 0.4)" }}>/</span>
            <span className="text-[11px] font-medium" style={{ color: "hsl(var(--muted-foreground) / 0.6)" }}>
              Contact
            </span>
          </nav>

          <div className="mt-5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>
              {t("Nous contacter", "Get in touch")}
            </p>
            <h1
              className="font-display"
              style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.08 }}
            >
              {t("Parlons-en", "Let's talk")}
            </h1>
            <p
              className="mt-3 leading-relaxed"
              style={{ fontSize: "0.9375rem", color: "hsl(var(--muted-foreground))", maxWidth: "48ch" }}
            >
              {t(
                "Question, suggestion ou correction — nous sommes à l'écoute.",
                "Question, suggestion, or correction — we're listening."
              )}
            </p>
          </div>
        </div>
      </section>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col gap-10 lg:flex-row lg:gap-16">

          {/* Left — form ─────────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>
              {t("Formulaire", "Form")}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="contact-name" className="text-sm font-medium text-foreground">
                    {t("Nom", "Name")}
                  </label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    required
                    placeholder={t("Votre nom", "Your name")}
                    className={inputClass}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "hsl(var(--primary) / 0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px hsl(var(--primary) / 0.1)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "hsl(var(--border))"; e.currentTarget.style.boxShadow = "none"; }}
                  />
                  <ValidationError field="name" errors={state.errors} className="mt-1 text-xs text-destructive" />
                </div>
                <div>
                  <label htmlFor="contact-email" className="text-sm font-medium text-foreground">
                    Email
                  </label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    className={inputClass}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "hsl(var(--primary) / 0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px hsl(var(--primary) / 0.1)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "hsl(var(--border))"; e.currentTarget.style.boxShadow = "none"; }}
                  />
                  <ValidationError field="email" errors={state.errors} className="mt-1 text-xs text-destructive" />
                </div>
              </div>

              <div>
                <label htmlFor="contact-subject" className="text-sm font-medium text-foreground">
                  {t("Sujet", "Subject")}
                </label>
                <input
                  id="contact-subject"
                  name="subject"
                  type="text"
                  required
                  placeholder={t("En quelques mots…", "In a few words…")}
                  className={inputClass}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "hsl(var(--primary) / 0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px hsl(var(--primary) / 0.1)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "hsl(var(--border))"; e.currentTarget.style.boxShadow = "none"; }}
                />
                <ValidationError field="subject" errors={state.errors} className="mt-1 text-xs text-destructive" />
              </div>

              <div>
                <label htmlFor="contact-message" className="text-sm font-medium text-foreground">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  required
                  rows={6}
                  placeholder={t("Décrivez votre demande…", "Describe your request…")}
                  className={`${inputClass} resize-none`}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "hsl(var(--primary) / 0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px hsl(var(--primary) / 0.1)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "hsl(var(--border))"; e.currentTarget.style.boxShadow = "none"; }}
                />
                <ValidationError field="message" errors={state.errors} className="mt-1 text-xs text-destructive" />
              </div>

              {/* Form-level errors — filter raw network messages, show friendly fallback */}
              {state.errors?.filter((e: any) => !e.field).length > 0 && (
                <div
                  className="flex items-start gap-2.5 rounded-lg px-4 py-3 text-sm"
                  style={{ background: "hsl(var(--destructive) / 0.06)", border: "1px solid hsl(var(--destructive) / 0.2)", color: "hsl(var(--destructive))" }}
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    {t(
                      "Une erreur est survenue. Réessayez ou écrivez directement à ",
                      "Something went wrong. Please try again or email "
                    )}
                    <a href="mailto:contact@tooltrim.com" className="font-medium underline underline-offset-2">
                      contact@tooltrim.com
                    </a>
                  </span>
                </div>
              )}

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={state.submitting}
                  className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: "hsl(var(--foreground))", color: "hsl(var(--background))" }}
                  onMouseEnter={(e) => { if (!state.submitting) (e.currentTarget as HTMLElement).style.background = "hsl(var(--foreground) / 0.85)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(var(--foreground))"; }}
                >
                  {state.submitting ? t("Envoi…", "Sending…") : t("Envoyer le message", "Send message")}
                  {!state.submitting && <ArrowRight className="h-3.5 w-3.5" />}
                </button>
              </div>
            </form>
          </div>

          {/* Right — info sidebar ─────────────────────────────────────────────── */}
          <div className="w-full lg:w-[280px] shrink-0">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>
              {t("Pourquoi nous écrire", "Why write to us")}
            </p>

            <div className="flex flex-col gap-3">
              {reasons.map((r) => (
                <div
                  key={r.title}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
                >
                  <div
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: "hsl(var(--primary) / 0.08)", color: "hsl(var(--primary))" }}
                  >
                    <r.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{r.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {r.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Direct email */}
            <div className="mt-6 border-t border-border pt-6">
              <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>
                Email direct
              </p>
              <a
                href="mailto:contact@tooltrim.com"
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-opacity hover:opacity-70"
                style={{ fontFamily: "ui-monospace, monospace" }}
              >
                contact@tooltrim.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
