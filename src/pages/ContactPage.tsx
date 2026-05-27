import { useEffect, useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { setSeoTags, setHreflang, cleanupSeo, SEO_BASE } from "@/lib/seo";

type Status = "idle" | "submitting" | "success" | "error";

/**
 * Contact — editorial chrome (tt-page-hero + date stamp) wrapping a clean
 * functional form. No decorative icons, no card stack for "reasons", no
 * shadcn hsl vars. Form fields use the shared .tt-form-* classes so any
 * future form on the site can drop in without a rewrite.
 */
const ContactPage = () => {
  const { t, lang, prefix } = useLang();
  const [status, setStatus] = useState<Status>("idle");
  const formRef = useRef<HTMLFormElement>(null);

  /* Pre-fill subject when arriving via ?subject= (e.g. footer "Soumettre
     un outil" link → ?subject=submit-tool). Recognised keys → localized
     subject; unknown values fall back to the raw query string. */
  const [searchParams] = useSearchParams();
  const subjectParam = searchParams.get("subject") ?? "";
  const subjectPresets: Record<string, { fr: string; en: string }> = {
    "submit-tool": { fr: "Soumettre un outil", en: "Submit a tool" },
    partnership:   { fr: "Partenariat éditeur", en: "Vendor partnership" },
    correction:    { fr: "Correction de fiche", en: "Page correction" },
  };
  const initialSubject = subjectPresets[subjectParam]
    ? subjectPresets[subjectParam][lang === "en" ? "en" : "fr"]
    : subjectParam;

  const now = new Date();
  const monthFr = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  const monthEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const stamp = lang === "fr"
    ? `Contact · ${monthFr[now.getMonth()]} ${now.getFullYear()}`
    : `Contact · ${monthEn[now.getMonth()]} ${now.getFullYear()}`;

  useEffect(() => {
    const title = t("Contact — ToolTrim", "Contact — ToolTrim");
    const desc = t(
      "Une question, une suggestion, une correction. On lit chaque message. Réponse sous 48 heures.",
      "A question, a suggestion, a correction. We read every message. Response within 48 hours.",
    );
    setSeoTags({ title, description: desc, url: `${SEO_BASE}/${lang}/contact` });
    setHreflang(`/${lang}/contact`);
    return () => cleanupSeo([]);
  }, [lang, t]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("submitting");

    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      subject: (form.elements.namedItem("subject") as HTMLInputElement).value,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement).value,
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  };

  // ── Success screen — editorial tone, not generic check-mark ──
  if (status === "success") {
    return (
      <div className="ab-page">
        <section className="tt-page-hero">
          <div className="tt-page-hero-inner">
            <span className="tt-page-hero-eyebrow">{t("Message reçu", "Message received")}</span>
            <h1 className="tt-page-hero-title">{t("Bien reçu. Merci.", "Got it. Thanks.")}</h1>
            <p className="tt-page-hero-desc">
              {t(
                "On revient vers toi dans les 48 heures. Pas de réponse automatique — un humain lit ton message.",
                "We'll get back to you within 48 hours. No auto-reply — a human reads your message.",
              )}
            </p>
            <div className="tt-page-hero-cta">
              <Link to={`${prefix}/tools`} className="tt-button-primary">
                {t("Explorer le catalogue →", "Browse the catalog →")}
              </Link>
              <Link to={`${prefix}/comparatifs`} className="ab-cta-secondary">
                {t("Voir les comparatifs", "See the comparisons")}
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="ab-page">

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="tt-page-hero">
        <div className="tt-page-hero-inner">
          <div className="ab-hero-meta">
            <nav className="cp-breadcrumb" aria-label="Breadcrumb">
              <Link to={prefix || "/fr"}>ToolTrim</Link>
              <span>/</span>
              <span>Contact</span>
            </nav>
            <time className="cp-hero-checked" dateTime={now.toISOString().slice(0, 10)}>{stamp}</time>
          </div>

          <span className="tt-page-hero-eyebrow">{t("Contact", "Contact")}</span>
          <h1 className="tt-page-hero-title">{t("Parlons-en.", "Let's talk.")}</h1>
          <p className="tt-page-hero-desc">
            {t(
              "Question, suggestion, correction — on lit chaque message. Réponse sous 48 heures, par un humain.",
              "Question, suggestion, correction — we read every message. Response within 48 hours, by a human.",
            )}
          </p>
        </div>
      </section>

      {/* ── Body — form + side info ──────────────────────────── */}
      <div className="cn-body">
        <div className="cn-container">

          <div className="cn-grid">

            {/* Left — form */}
            <form ref={formRef} onSubmit={handleSubmit} className="cn-form" noValidate>
              <div className="cn-form-row">
                <div className="tt-form-field">
                  <label htmlFor="contact-name" className="tt-form-label">{t("Nom", "Name")}</label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    required
                    placeholder={t("Ton nom", "Your name")}
                    className="tt-form-input"
                    autoComplete="name"
                  />
                </div>
                <div className="tt-form-field">
                  <label htmlFor="contact-email" className="tt-form-label">Email</label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="tt-form-input"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="tt-form-field">
                <label htmlFor="contact-subject" className="tt-form-label">{t("Sujet", "Subject")}</label>
                <input
                  id="contact-subject"
                  name="subject"
                  type="text"
                  required
                  placeholder={t("En quelques mots…", "In a few words…")}
                  className="tt-form-input"
                  defaultValue={initialSubject}
                />
              </div>

              <div className="tt-form-field">
                <label htmlFor="contact-message" className="tt-form-label">Message</label>
                <textarea
                  id="contact-message"
                  name="message"
                  required
                  rows={7}
                  placeholder={t("Décris ta demande…", "Describe your request…")}
                  className="tt-form-input tt-form-textarea"
                />
              </div>

              {status === "error" && (
                <p className="tt-form-error" role="alert">
                  {t(
                    "Une erreur est survenue. Réessaye, ou écris directement à ",
                    "Something went wrong. Try again, or email ",
                  )}
                  <a href="mailto:contact@tooltrim.com" className="tt-form-error-link">contact@tooltrim.com</a>
                </p>
              )}

              <div className="cn-form-actions">
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="tt-button-primary"
                >
                  {status === "submitting"
                    ? t("Envoi…", "Sending…")
                    : t("Envoyer le message →", "Send the message →")}
                </button>
              </div>
            </form>

            {/* Right — side info */}
            <aside className="cn-aside">
              <div className="cn-aside-block">
                <span className="cn-aside-label">{t("Email direct", "Direct email")}</span>
                <a
                  href="mailto:contact@tooltrim.com"
                  className="cn-aside-email"
                >
                  contact@tooltrim.com
                </a>
              </div>

              <div className="cn-aside-block">
                <span className="cn-aside-label">{t("Délai de réponse", "Response time")}</span>
                <p className="cn-aside-text">{t("Sous 48 heures ouvrées.", "Within 48 working hours.")}</p>
              </div>

              <div className="cn-aside-block">
                <span className="cn-aside-label">{t("Avant d'écrire", "Before writing")}</span>
                <p className="cn-aside-text">
                  {t(
                    "Ta réponse est probablement déjà dans la ",
                    "Your answer is probably already in our ",
                  )}
                  <Link to={`${prefix}/methodology`} className="ab-inline-link">
                    {t("méthodologie", "methodology")}
                  </Link>
                  {t(" ou dans la ", " or our ")}
                  <Link to={`${prefix}/transparency`} className="ab-inline-link">
                    {t("page transparence", "transparency page")}
                  </Link>
                  .
                </p>
              </div>
            </aside>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
