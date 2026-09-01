import { useEffect, useState, useRef } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import Breadcrumb from "@/components/Breadcrumb";
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
  const isToolSubmission = subjectParam === "submit-tool";
  const [badgeReview, setBadgeReview] = useState(false);

  const now = new Date();
  const monthFr = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  const monthEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const stamp = lang === "fr"
    ? `Contact · ${monthFr[now.getMonth()]} ${now.getFullYear()}`
    : `Contact · ${monthEn[now.getMonth()]} ${now.getFullYear()}`;

  useEffect(() => {
    const title = isToolSubmission
      ? t("Proposer un outil — ToolTrim", "Submit a tool — ToolTrim")
      : t("Contact — ToolTrim", "Contact — ToolTrim");
    const desc = t(
      isToolSubmission
        ? "Propose un outil à ToolTrim. Chaque soumission est revue selon nos critères éditoriaux."
        : "Une question, une suggestion, une correction. On lit chaque message. Réponse sous 48 heures.",
      isToolSubmission
        ? "Submit a tool to ToolTrim. Every submission is reviewed against our editorial criteria."
        : "A question, a suggestion, a correction. We read every message. Response within 48 hours.",
    );
    setSeoTags({ title, description: desc, url: `${SEO_BASE}/${lang}/contact` });
    setHreflang(`/${lang}/contact`);
    return () => cleanupSeo([]);
  }, [isToolSubmission, lang, t]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("submitting");

    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      subject: (form.elements.namedItem("subject") as HTMLInputElement).value,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement).value,
      submissionType: isToolSubmission ? "tool" : "contact",
      toolName: isToolSubmission ? (form.elements.namedItem("toolName") as HTMLInputElement).value : "",
      toolUrl: isToolSubmission ? (form.elements.namedItem("toolUrl") as HTMLInputElement).value : "",
      submitterRole: isToolSubmission ? (form.elements.namedItem("submitterRole") as HTMLSelectElement).value : "",
      badgeReview: isToolSubmission && badgeReview,
      badgeUrl: isToolSubmission && badgeReview
        ? (form.elements.namedItem("badgeUrl") as HTMLInputElement).value
        : "",
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

  if (isToolSubmission) {
    return <Navigate to={`${prefix}/submit`} replace />;
  }

  // ── Success screen — editorial tone, not generic check-mark ──
  if (status === "success") {
    return (
      <div className="ab-page">
        <section className="tt-page-hero">
          <div className="tt-page-hero-inner">
            <span className="tt-page-hero-eyebrow">
              {isToolSubmission ? t("Outil proposé", "Tool submitted") : t("Message reçu", "Message received")}
            </span>
            <h1 className="tt-page-hero-title">
              {isToolSubmission ? t("La revue peut commencer.", "The review can begin.") : t("Bien reçu. Merci.", "Got it. Thanks.")}
            </h1>
            <p className="tt-page-hero-desc">
              {isToolSubmission
                ? t(
                    badgeReview
                      ? "On vérifie le badge puis l'outil en priorité. La publication reste soumise à nos critères éditoriaux."
                      : "On vérifie les informations transmises. La publication reste soumise à nos critères éditoriaux.",
                    badgeReview
                      ? "We'll verify the badge, then review the tool as a priority. Publication still depends on our editorial criteria."
                      : "We'll verify the submitted information. Publication still depends on our editorial criteria.",
                  )
                : t(
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
            <Breadcrumb items={[{ label: "Contact" }]} />
            <time className="cp-hero-checked" dateTime={now.toISOString().slice(0, 10)}>{stamp}</time>
          </div>

          <span className="tt-page-hero-eyebrow">
            {isToolSubmission ? t("Référencement ToolTrim", "ToolTrim listing") : t("Contact", "Contact")}
          </span>
          <h1 className="tt-page-hero-title">
            {isToolSubmission ? t("Proposer un outil.", "Submit a tool.") : t("Parlons-en.", "Let's talk.")}
          </h1>
          <p className="tt-page-hero-desc">
            {isToolSubmission
              ? t(
                  "Présente-nous ton outil. Chaque proposition est vérifiée par un humain — le badge accélère la revue, sans acheter la publication.",
                  "Tell us about your tool. Every submission is checked by a human — the badge speeds up review without buying publication.",
                )
              : t(
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
            <form ref={formRef} onSubmit={handleSubmit} className="cn-form">
              {isToolSubmission && (
                <div className="cn-submission-intro">
                  <p className="cn-submission-kicker">{t("1 · L'outil", "1 · The tool")}</p>
                  <p>{t("Les informations indispensables pour vérifier qu'il correspond au catalogue ToolTrim.", "The essential information we need to check whether it fits the ToolTrim catalog.")}</p>
                </div>
              )}

              {isToolSubmission && (
                <div className="cn-form-row">
                  <div className="tt-form-field">
                    <label htmlFor="contact-tool-name" className="tt-form-label">{t("Nom de l'outil", "Tool name")}</label>
                    <input id="contact-tool-name" name="toolName" type="text" required maxLength={100} placeholder="Acme" className="tt-form-input" />
                  </div>
                  <div className="tt-form-field">
                    <label htmlFor="contact-tool-url" className="tt-form-label">{t("Site officiel", "Official website")}</label>
                    <input id="contact-tool-url" name="toolUrl" type="url" required maxLength={300} placeholder="https://…" className="tt-form-input" inputMode="url" />
                  </div>
                </div>
              )}

              {isToolSubmission && (
                <div className="tt-form-field">
                  <label htmlFor="contact-role" className="tt-form-label">{t("Ton lien avec l'outil", "Your relationship to the tool")}</label>
                  <select id="contact-role" name="submitterRole" required defaultValue="" className="tt-form-input">
                    <option value="" disabled>{t("Sélectionner…", "Select…")}</option>
                    <option value="founder">{t("Fondateur·rice / équipe", "Founder / team")}</option>
                    <option value="user">{t("Utilisateur·rice", "User")}</option>
                    <option value="agency">{t("Agence / partenaire", "Agency / partner")}</option>
                    <option value="other">{t("Autre", "Other")}</option>
                  </select>
                </div>
              )}
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

              {isToolSubmission ? (
                <input name="subject" type="hidden" value={initialSubject} />
              ) : (
                <div className="tt-form-field">
                  <label htmlFor="contact-subject" className="tt-form-label">{t("Sujet", "Subject")}</label>
                  <input
                    id="contact-subject"
                    name="subject"
                    type="text"
                    required
                    maxLength={160}
                    placeholder={t("En quelques mots…", "In a few words…")}
                    className="tt-form-input"
                    defaultValue={initialSubject}
                  />
                </div>
              )}

              <div className="tt-form-field">
                <label htmlFor="contact-message" className="tt-form-label">
                  {isToolSubmission ? t("Description courte", "Short description") : "Message"}
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  required
                  rows={7}
                  maxLength={2000}
                  placeholder={isToolSubmission
                    ? t("À qui s'adresse l'outil, quel problème résout-il et qu'est-ce qui le distingue ?", "Who is the tool for, what problem does it solve, and what makes it different?")
                    : t("Décris ta demande…", "Describe your request…")}
                  className="tt-form-input tt-form-textarea"
                />
              </div>

              {isToolSubmission && (
                <fieldset className="cn-review-options">
                  <legend className="cn-submission-kicker">{t("2 · Choisir le délai de revue", "2 · Choose the review time")}</legend>
                  <label className={`cn-review-option${!badgeReview ? " cn-review-option--selected" : ""}`}>
                    <input type="radio" name="reviewLane" value="standard" checked={!badgeReview} onChange={() => setBadgeReview(false)} />
                    <span>
                      <strong>{t("Revue standard", "Standard review")}</strong>
                      <small>{t("Gratuite · réponse visée sous 10 jours ouvrés", "Free · target response within 10 working days")}</small>
                    </span>
                  </label>
                  <label className={`cn-review-option${badgeReview ? " cn-review-option--selected" : ""}`}>
                    <input type="radio" name="reviewLane" value="badge" checked={badgeReview} onChange={() => setBadgeReview(true)} />
                    <span>
                      <strong>{t("Revue prioritaire avec badge", "Priority review with badge")}</strong>
                      <small>{t("Gratuite · réponse visée sous 5 jours après vérification", "Free · target response within 5 days after verification")}</small>
                    </span>
                  </label>
                </fieldset>
              )}

              {isToolSubmission && badgeReview && (
                <div className="cn-badge-panel">
                  <div className="cn-badge-preview">
                    <img src="/tooltrim-badge.svg" alt={t("Découvrir ToolTrim", "Discover ToolTrim")} width={200} height={50} />
                  </div>
                  <div className="cn-badge-copy">
                    <p>{t("Ajoute ce badge sur une page publique de ton site, puis indique son URL ci-dessous. Un lien vers ToolTrim est requis pour permettre la vérification.", "Add this badge to a public page on your website, then enter its URL below. A link to ToolTrim is required so we can verify it.")}</p>
                    <code>{'<a href="https://tooltrim.com"><img src="https://tooltrim.com/tooltrim-badge.svg" alt="Discover ToolTrim"></a>'}</code>
                  </div>
                  <div className="tt-form-field">
                    <label htmlFor="contact-badge-url" className="tt-form-label">{t("URL où le badge est visible", "URL where the badge is visible")}</label>
                    <input id="contact-badge-url" name="badgeUrl" type="url" required maxLength={300} placeholder="https://…" className="tt-form-input" inputMode="url" />
                  </div>
                  <p className="cn-badge-disclosure">{t("Le badge accélère uniquement la revue. Il ne garantit ni la publication, ni une meilleure note, ni un meilleur classement.", "The badge only speeds up review. It does not guarantee publication, a higher score, or better ranking.")}</p>
                </div>
              )}

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
                    : isToolSubmission
                      ? t("Proposer cet outil →", "Submit this tool →")
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
                <span className="cn-aside-label">
                  {isToolSubmission ? t("Ce que nous regardons", "What we look for") : t("Délai de réponse", "Response time")}
                </span>
                <p className="cn-aside-text">
                  {isToolSubmission
                    ? t("Un produit actif, un site officiel clair, une utilité réelle et des informations vérifiables.", "An active product, a clear official website, real utility, and verifiable information.")
                    : t("Sous 48 heures ouvrées.", "Within 48 working hours.")}
                </p>
              </div>

              <div className="cn-aside-block">
                <span className="cn-aside-label">
                  {isToolSubmission ? t("Indépendance éditoriale", "Editorial independence") : t("Avant d'écrire", "Before writing")}
                </span>
                <p className="cn-aside-text">
                  {isToolSubmission ? t(
                    "Toutes les propositions suivent la même méthodologie. Le badge influence le délai de revue, jamais le verdict.",
                    "Every submission follows the same methodology. The badge affects review time, never the verdict.",
                  ) : <>
                    {t("Ta réponse est probablement déjà dans la ", "Your answer is probably already in our ")}
                    <Link to={`${prefix}/methodology`} className="ab-inline-link">{t("méthodologie", "methodology")}</Link>
                    {t(" ou dans la ", " or our ")}
                    <Link to={`${prefix}/transparency`} className="ab-inline-link">{t("page transparence", "transparency page")}</Link>.
                  </>}
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
