import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Breadcrumb from "@/components/Breadcrumb";
import { useLang } from "@/hooks/useLang";
import { cleanupSeo, SEO_BASE, setHreflang, setSeoTags } from "@/lib/seo";
import { trackEvent } from "@/lib/analytics";
import { BadgeCheck, Briefcase, Check, ChevronDown, Clock, Globe, Mail, MessageSquare, ShieldCheck, User, Zap } from "@/lib/icons";

type Step = 1 | 2 | 3;
type Status = "idle" | "saving" | "checking" | "submitting" | "success" | "error";
type BadgeTheme = "light" | "dark";

type Submission = {
  toolName: string;
  toolUrl: string;
  submitterRole: string;
  name: string;
  email: string;
  message: string;
  badgeUrl: string;
  verificationToken: string;
};

const EMPTY_SUBMISSION: Submission = {
  toolName: "",
  toolUrl: "",
  submitterRole: "",
  name: "",
  email: "",
  message: "",
  badgeUrl: "",
  verificationToken: "",
};

const SUBMIT_FAQ: { q: string; qEn: string; a: string; aEn: string }[] = [
  {
    q: "Qu'est-ce que ToolTrim ?",
    qEn: "What is ToolTrim?",
    a: "ToolTrim est un site éditorial de comparaison d'outils SaaS pour freelances et petites équipes. Chaque fiche est écrite pour aider à choisir, pas pour empiler des logos.",
    aEn: "ToolTrim is an editorial comparison site for SaaS tools, built for freelancers and small teams. Every listing is written to help with a decision, not to stack logos.",
  },
  {
    q: "Quelle est la différence entre le badge gratuit et la publication payante ?",
    qEn: "What's the difference between the free badge and the paid publication?",
    a: "Le badge gratuit demande d'installer un lien vers ToolTrim sur ton site, puis ta soumission suit la revue éditoriale classique. La publication payante retire cette étape, passe devant la file et t'offre une révision avec le fondateur avant la mise en ligne.",
    aEn: "The free badge asks you to install a link to ToolTrim on your website, then your submission follows the normal editorial review. The paid publication removes that step, jumps the queue, and gives you one review round with the founder before it goes live.",
  },
  {
    q: "Combien de temps prend la revue éditoriale ?",
    qEn: "How long does the editorial review take?",
    a: "En général quelques jours ouvrés pour le badge gratuit. Les soumissions payantes sont traitées en priorité.",
    aEn: "Usually a few business days for the free badge. Paid submissions are handled with priority.",
  },
  {
    q: "Le badge gratuit garantit-il la publication ?",
    qEn: "Does the free badge guarantee publication?",
    a: "Non. Une fois le badge vérifié, la soumission est complète et passe en revue. La publication payante, elle, garantit la mise en ligne.",
    aEn: "No. Once the badge is verified, the submission is complete and goes to review. The paid publication, on the other hand, guarantees it goes live.",
  },
  {
    q: "Puis-je modifier ma fiche une fois publiée ?",
    qEn: "Can I update my listing after it's published?",
    a: "Oui, écris-nous à contact@tooltrim.com avec les changements et nous mettons la fiche à jour.",
    aEn: "Yes, email us at contact@tooltrim.com with the changes and we'll update the listing.",
  },
];

const SUBMIT_DRAFT_KEY = "tt_submit_draft";
const CREEM_PAYMENT_LINK = "https://www.creem.io/payment/prod_2LMoN4zyRhNAb53r3rWpwX";
const SKIP_BADGE_PRICE = "29 $";
// Toggle off once the launch price ends — removes the "Special offer" flag without touching the rest of the copy.
const SPECIAL_OFFER_ACTIVE = true;

const SubmitToolPage = () => {
  const { t, lang, prefix } = useLang();
  const [searchParams, setSearchParams] = useSearchParams();
  const [step, setStep] = useState<Step>(1);
  const [status, setStatus] = useState<Status>("idle");
  const [badgeTheme, setBadgeTheme] = useState<BadgeTheme>("light");
  const [badgeInstalled, setBadgeInstalled] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [error, setError] = useState("");
  const [submission, setSubmission] = useState<Submission>(EMPTY_SUBMISSION);
  const [paid, setPaid] = useState(false);
  const [planChoice, setPlanChoice] = useState<"free" | "paid" | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const infoFormRef = useRef<HTMLFormElement>(null);
  const badgeUrlRef = useRef<HTMLInputElement>(null);
  const sentProgressRef = useRef(new Set<string>());

  useEffect(() => {
    if (searchParams.get("paid") !== "1") return;
    let draft: Submission | null = null;
    try {
      const raw = window.localStorage.getItem(SUBMIT_DRAFT_KEY);
      if (raw) {
        draft = JSON.parse(raw) as Submission;
        window.localStorage.removeItem(SUBMIT_DRAFT_KEY);
      }
    } catch {
      draft = null;
    }
    if (draft && draft.toolName) {
      setSubmission(draft);
      setPaid(true);
      setPlanChoice("paid");
      setStep(3);
    } else {
      setError(t(
        "Paiement reçu, mais tes informations n'ont pas pu être retrouvées sur cet appareil. Contacte-nous avec le nom de l'outil et le reçu de paiement.",
        "Payment received, but your information could not be recovered on this device. Contact us with the tool name and payment receipt.",
      ));
    }
    searchParams.delete("paid");
    setSearchParams(searchParams, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (document.querySelector('script[src="https://www.creem.io/embed.js"]')) return;
    const script = document.createElement("script");
    script.src = "https://www.creem.io/embed.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    setSeoTags({
      title: t("Soumettre un outil — ToolTrim", "Submit a tool — ToolTrim"),
      description: t(
        "Soumets ton outil à ToolTrim. Nous analysons son site, son utilité et ses informations avant toute publication.",
        "Submit your tool to ToolTrim. We review its website, usefulness, and information before publication.",
      ),
      url: `${SEO_BASE}/${lang}/submit`,
    });
    setHreflang(`/${lang}/submit`);
    return () => cleanupSeo([]);
  }, [lang, t]);

  const update = (field: keyof Submission, value: string) => {
    setSubmission((current) => ({ ...current, [field]: value }));
    setError("");
    if (status === "error") setStatus("idle");
  };

  const trackingSource = submission.toolName.trim().toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "submitted-tool";
  const badgeAsset = badgeTheme === "dark" ? "tooltrim-badge-dark.svg" : "tooltrim-badge.svg";
  const badgeAlt = `Discover ToolTrim via ${submission.toolName || "this tool"}`;
  const badgeAltHtml = badgeAlt
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
  const badgeHref = `https://tooltrim.com/?utm_source=${encodeURIComponent(trackingSource)}&utm_medium=badge&utm_campaign=tool_submission`;
  const badgeHtml = `<a target="_blank" href="${badgeHref}"><img src="https://tooltrim.com/${badgeAsset}" alt="${badgeAltHtml}" height="54" loading="lazy"></a>`;
  const badgeVerified = Boolean(submission.verificationToken);

  const copyBadgeCode = async () => {
    try {
      await navigator.clipboard.writeText(badgeHtml);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = badgeHtml;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    setCodeCopied(true);
    window.setTimeout(() => setCodeCopied(false), 1800);
  };

  const sendProgressEmail = async (progressStep: 1 | 2 | 3, paidFlag = false) => {
    const signature = `${progressStep}:${JSON.stringify(submission)}`;
    if (sentProgressRef.current.has(signature)) return;
    const endpoint = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
      ? "https://tooltrim.com/api/submission-progress"
      : "/api/submission-progress";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...submission, progressStep, paid: paidFlag, lang }),
    });
    if (!response.ok) throw new Error("progress_email_failed");
    sentProgressRef.current.add(signature);
  };

  const continueToPublication = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (new URL(submission.toolUrl).protocol !== "https:") {
      setStatus("error");
      setError(t("Le site officiel doit utiliser une adresse https://.", "The official website must use an https:// address."));
      return;
    }
    setStatus("saving");
    setError("");
    try {
      await sendProgressEmail(1);
      setStep(2);
      setStatus("idle");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setStatus("error");
      setError(t(
        "L’enregistrement de cette étape a échoué. Réessaie avant de continuer.",
        "This step could not be saved. Try again before continuing.",
      ));
    }
  };

  const verifyBadge = async () => {
    if (!submission.badgeUrl.trim()) {
      setStatus("error");
      setError(t(
        "Indique d’abord l’URL exacte de la page où tu as installé le badge.",
        "First enter the exact URL of the page where you installed the badge.",
      ));
      badgeUrlRef.current?.focus();
      return;
    }
    try {
      const badgePageUrl = new URL(submission.badgeUrl);
      if (badgePageUrl.protocol !== "https:") throw new Error("https_required");
    } catch {
      setStatus("error");
      setError(t(
        "Saisis une URL publique complète commençant par https://.",
        "Enter a complete public URL beginning with https://.",
      ));
      badgeUrlRef.current?.focus();
      return;
    }
    setStatus("checking");
    setError("");
    try {
      const verificationEndpoint = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "https://tooltrim.com/api/verify-badge"
        : "/api/verify-badge";
      const response = await fetch(verificationEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ badgeUrl: submission.badgeUrl, toolUrl: submission.toolUrl }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "badge_not_found");
      }
      const verifiedSubmission = { ...submission, verificationToken: payload.token || "" };
      setSubmission(verifiedSubmission);
      await sendProgressEmail(2);
      setStatus("idle");
      setStep(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (caughtError) {
      setStatus("error");
      const reason = caughtError instanceof Error ? caughtError.message : "verification_failed";
      setError(reason === "progress_email_failed"
        ? t("Le badge est valide, mais l’email de suivi n’a pas pu être envoyé. Réessaie.", "The badge is valid, but the progress email could not be sent. Try again.")
        : reason === "verification_unavailable"
        ? t("La vérification est temporairement indisponible. Réessaie dans quelques instants.", "Verification is temporarily unavailable. Try again in a moment.")
        : reason === "badge_wrong_domain"
          ? t("L’URL du badge doit appartenir au même site que l’outil soumis.", "The badge URL must be on the same website as the submitted tool.")
          : reason === "page_unreachable"
            ? t("La page indiquée est inaccessible. Vérifie son URL et qu’elle est publique.", "The page cannot be reached. Check its URL and make sure it is public.")
            : t(
              "Badge introuvable. Vérifie que le code fourni est présent dans le HTML public de la page.",
              "Badge not found. Check that the provided code is present in the page’s public HTML.",
            ));
    }
  };

  const payToSkipBadge = () => {
    try {
      window.localStorage.setItem(SUBMIT_DRAFT_KEY, JSON.stringify({ ...submission, lang }));
    } catch {
      // ignore storage failure, checkout still opens
    }
    trackEvent("submit_pay_skip_badge", { tool_name: submission.toolName });
    sendProgressEmail(3, true).catch(() => {
      // best-effort notification, checkout still opens regardless
    });
  };

  const choosePlan = (plan: "free" | "paid") => {
    setPlanChoice(plan);
    setStatus("idle");
    setError("");
    requestAnimationFrame(() => {
      document.getElementById("submit-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleFinalSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit();
  };

  const submit = async () => {
    setStatus("submitting");
    setError("");
    try {
      const submissionEndpoint = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "https://tooltrim.com/api/contact"
        : "/api/contact";
      const response = await fetch(submissionEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...submission,
          subject: t("Soumission d'un outil", "Tool submission"),
          submissionType: "tool",
          badgeReview: !paid,
          paid,
          lang,
        }),
      });
      if (!response.ok) throw new Error("submit_failed");
      trackEvent("submit_tool", { tool_name: submission.toolName, submitter_role: submission.submitterRole });
      setStatus("success");
    } catch {
      setStatus("error");
      setError(t(
        "L'envoi n'a pas abouti. Réessaie ou contacte-nous directement.",
        "The submission could not be sent. Try again or contact us directly.",
      ));
    }
  };

  if (status === "success") {
    return (
      <div className="stp-page">
        <section className="sp-success">
          <span className="tt-page-hero-eyebrow">{t("Soumission reçue", "Submission received")}</span>
          <h1>{paid ? t("Merci. Ta publication est garantie.", "Thank you. Your publication is guaranteed.") : t("Merci. Nous allons analyser le site.", "Thank you. We will review the website.")}</h1>
          <p>{paid ? t(
            "Le paiement est confirmé et la soumission est complète. Nous préparons ta fiche et te recontactons dès qu'elle est en ligne.",
            "Payment is confirmed and the submission is complete. We're preparing your listing and will reach out as soon as it's live.",
          ) : t(
            "Le badge a été vérifié et la soumission est complète. Nous étudierons l'outil, ses informations et son intérêt pour les utilisateurs de ToolTrim avant toute publication.",
            "The badge was verified and the submission is complete. We will review the tool, its information, and its value for ToolTrim users before any publication.",
          )}</p>
          <Link to={`${prefix}/tools`} className="tt-button-primary">{t("Explorer les outils →", "Explore tools →")}</Link>
        </section>
      </div>
    );
  }

  return (
    <div className="stp-page">
      <header className="sp-hero">
        <Breadcrumb items={[{ label: t("Soumettre un outil", "Submit a tool") }]} />
        <span className="tt-page-hero-eyebrow">{t("Soumission d'un outil", "Tool submission")}</span>
        <h1>{t("Soumets ton outil à ToolTrim.", "Submit your tool to ToolTrim.")}</h1>
        <p>{t(
          "Cette démarche permet de soumettre ton produit à notre équipe. Une fois le dossier envoyé, nous analyserons le site, les fonctionnalités et les informations disponibles avant de décider d'une publication.",
          "This process lets you submit your product to our team. Once submitted, we will review the website, features, and available information before deciding whether to publish it.",
        )}</p>
      </header>

      <section className="sp-fact-band">
        <div className="sp-fact-band-inner">
          <div className="sp-fact"><BadgeCheck size={20} /><div><span className="sp-fact-value">{t("1 100+", "1,100+")}</span><span className="sp-fact-label">{t("Outils déjà référencés", "Tools already listed")}</span></div></div>
          <div className="sp-fact"><Clock size={20} /><div><span className="sp-fact-value">{t("Quelques jours", "A few days")}</span><span className="sp-fact-label">{t("Délai de revue éditoriale", "Editorial review turnaround")}</span></div></div>
          <div className="sp-fact"><ShieldCheck size={20} /><div><span className="sp-fact-value">0 $</span><span className="sp-fact-label">{t("Badge gratuit, aucune carte requise", "Free badge, no card required")}</span></div></div>
        </div>
      </section>

      <section className="sp-overview">
        <div className="sp-overview-inner">
        <div className="sp-section-heading">
          <span>—</span>
          <div>
            <h2>{t("Deux façons de rejoindre ToolTrim", "Two ways to join ToolTrim")}</h2>
            <p>{t(
              "Choisis l'option qui correspond à ton rythme. Les deux passent par le même formulaire ci-dessous.",
              "Pick the option that fits your pace. Both go through the same form below.",
            )}</p>
          </div>
        </div>
        <div className="sp-plan-grid">
          <div className="sp-plan-card">
            <div className="sp-plan-card-head">
              <div><span className="sp-plan-price">0 $</span><span className="sp-plan-period">{t("pour toujours", "forever")}</span></div>
              <span className="sp-plan-name">{t("Badge gratuit", "Free badge")}</span>
            </div>
            <p className="sp-plan-desc">{t(
              "Installe notre badge de découverte sur ton site. Une fois vérifié, ta soumission passe en revue éditoriale.",
              "Install our discovery badge on your site. Once verified, your submission goes to editorial review.",
            )}</p>
            <ul className="sp-plan-args">
              <li><Check size={15} /><span>{t("Aucun paiement requis", "No payment required")}</span></li>
              <li><Check size={15} /><span>{t("Vérification automatique du badge", "Automatic badge verification")}</span></li>
              <li><Check size={15} /><span>{t("Lien dofollow une fois le badge vérifié", "Dofollow link once the badge is verified")}</span></li>
            </ul>
            <button type="button" className="tt-button-secondary sp-plan-cta" onClick={() => choosePlan("free")}>{t("Choisir le badge gratuit →", "Choose the free badge →")}</button>
          </div>
          <div className="sp-plan-card sp-plan-card--highlight">
            <span className="sp-plan-tag"><Zap size={13} />{t("Publication garantie", "Guaranteed publication")}</span>
            <div className="sp-plan-card-head">
              <div><span className="sp-plan-price">{SKIP_BADGE_PRICE}</span><span className="sp-plan-period">{t("paiement unique", "one-time")}</span>{SPECIAL_OFFER_ACTIVE && <span className="sp-plan-flag">{t("Offre spéciale", "Special offer")}</span>}</div>
              <span className="sp-plan-name">{t("Publication payante", "Paid publication")}</span>
            </div>
            <p className="sp-plan-desc">{t(
              "Pas de badge à installer. Ta fiche est traitée en priorité, avec le fondateur de ToolTrim à l'écoute.",
              "No badge to install. Your listing is handled with priority, with ToolTrim's founder on hand.",
            )}</p>
            <div className="sp-cert-badge"><BadgeCheck size={14} />{t("Certifié ToolTrim", "ToolTrim Certified")}</div>
            <ul className="sp-plan-args">
              <li><Check size={15} /><span>{t("Publication garantie, sans badge à installer", "Guaranteed publication, no badge to install")}</span></li>
              <li><Check size={15} /><span>{t("Accès prioritaire à la file de revue", "Priority access ahead of the review queue")}</span></li>
              <li><Check size={15} /><span>{t("Une révision avec le fondateur avant mise en ligne", "One review round with the founder before it goes live")}</span></li>
              <li><Check size={15} /><span>{t("Flag de certification affiché sur ta fiche", "Certification flag shown on your listing")}</span></li>
            </ul>
            <button type="button" className="tt-button-primary sp-plan-cta" onClick={() => choosePlan("paid")}>{t(`Publier pour ${SKIP_BADGE_PRICE} →`, `Publish for ${SKIP_BADGE_PRICE} →`)}</button>
          </div>
        </div>
        </div>
      </section>

      {planChoice && (
      <div className="sp-shell" id="submit-form">
      <div className="sp-shell-inner">
        <ol className="sp-steps" aria-label={t("Étapes de la soumission", "Submission steps")}>
          {[1, 2, 3].map((number) => (
            <li key={number} className="sp-step-item">
              <span className={`sp-step ${step === number ? "sp-step--active" : ""}${step > number ? " sp-step--done" : ""}`}>
                <span className="sp-step-dot">{step > number ? <Check size={13} /> : number}</span>
                <strong>{number === 1 ? t("Contact", "Contact") : number === 2 ? t("Publication", "Publication") : t("Finalisation", "Details")}</strong>
              </span>
              {number < 3 && <span className={`sp-step-connector${step > number ? " sp-step-connector--filled" : ""}`} aria-hidden="true" />}
            </li>
          ))}
        </ol>

        <main className="sp-card">
          {step === 1 && (
            <form ref={infoFormRef} onSubmit={continueToPublication} className="sp-form">
              <div className="sp-section-heading">
                <span>01</span>
                <div><h2>{t("De quoi te recontacter", "Enough to reach you")}</h2><p>{t("Le nom de l'outil, son site et ton email. Le reste vient une fois l'étape suivante engagée.", "The tool's name, its website, and your email. The rest comes once the next step is underway.")}</p></div>
              </div>
              <div className="sp-form-grid">
                <div className="tt-form-field"><label className="tt-form-label" htmlFor="submit-tool-name">{t("Nom de l'outil", "Tool name")}</label><div className="sp-input-wrap"><User size={16} className="sp-input-icon" /><input className="tt-form-input" id="submit-tool-name" required maxLength={100} value={submission.toolName} onChange={(e) => update("toolName", e.target.value)} placeholder="Acme" /></div></div>
                <div className="tt-form-field"><label className="tt-form-label" htmlFor="submit-tool-url">{t("Site officiel", "Official website")}</label><div className="sp-input-wrap"><Globe size={16} className="sp-input-icon" /><input className="tt-form-input" id="submit-tool-url" required type="url" maxLength={300} value={submission.toolUrl} onChange={(e) => update("toolUrl", e.target.value)} placeholder="https://…" /></div></div>
              </div>
              <div className="tt-form-field"><label className="tt-form-label" htmlFor="submit-email">Email</label><div className="sp-input-wrap"><Mail size={16} className="sp-input-icon" /><input className="tt-form-input" id="submit-email" required type="email" maxLength={200} autoComplete="email" value={submission.email} onChange={(e) => update("email", e.target.value)} placeholder="you@example.com" /></div></div>
              {error && <p className="tt-form-error" role="alert">{error}</p>}
              <div className="sp-actions"><button type="submit" className="tt-button-primary" disabled={status === "saving"}>{status === "saving" ? t("Enregistrement…", "Saving…") : t("Continuer →", "Continue →")}</button></div>
            </form>
          )}

          {step === 2 && planChoice === "paid" && (
            <section className="sp-form">
              <div className="sp-section-heading"><span>02</span><div><h2>{t("Publication payante", "Paid publication")}</h2><p>{t("Aucun badge à installer : le paiement débloque directement la dernière étape.", "No badge to install: payment unlocks the final step directly.")}</p></div></div>
              <div className="sp-plan-card sp-plan-card--highlight">
                <span className="sp-plan-tag"><Zap size={13} />{t("Publication garantie", "Guaranteed publication")}</span>
                <div className="sp-plan-card-head">
                  <div><span className="sp-plan-price">{SKIP_BADGE_PRICE}</span><span className="sp-plan-period">{t("paiement unique", "one-time")}</span>{SPECIAL_OFFER_ACTIVE && <span className="sp-plan-flag">{t("Offre spéciale", "Special offer")}</span>}</div>
                  <span className="sp-plan-name">{t("Publication payante", "Paid publication")}</span>
                </div>
                <p className="sp-plan-desc">{t("Pas de badge à installer : ta fiche est traitée en priorité, avec un vrai humain à l'écoute.", "No badge to install: your listing is handled with priority, with a real human on hand.")}</p>
                <div className="sp-cert-badge"><BadgeCheck size={14} />{t("Certifié ToolTrim", "ToolTrim Certified")}</div>
                <ul className="sp-plan-args">
                  <li><Check size={15} /><span>{t(`${SKIP_BADGE_PRICE}, paiement unique — aucun abonnement`, `${SKIP_BADGE_PRICE}, one-time — no subscription`)}</span></li>
                  <li><Check size={15} /><span>{t("Publication garantie, sans badge à installer", "Guaranteed publication, no badge to install")}</span></li>
                  <li><Check size={15} /><span>{t("Accès prioritaire : ta soumission passe devant la file", "Priority access: your submission jumps the queue")}</span></li>
                  <li><Check size={15} /><span>{t("Une révision incluse : je te montre ta fiche, tu ajustes, je publie", "One review round included: I show you the draft, you flag changes, then it's live")}</span></li>
                  <li><Check size={15} /><span>{t("Flag de certification affiché sur ta fiche", "Certification flag shown on your listing")}</span></li>
                  <li><Check size={15} /><span>{t("Lien dofollow permanent dès le paiement", "Permanent dofollow link as soon as you pay")}</span></li>
                </ul>
                <a
                  href={CREEM_PAYMENT_LINK}
                  data-creem-checkout
                  className="tt-button-primary sp-plan-cta"
                  onClick={payToSkipBadge}
                >
                  {t(`Publier pour ${SKIP_BADGE_PRICE} →`, `Publish for ${SKIP_BADGE_PRICE} →`)}
                </a>
              </div>
              <div className="sp-note"><strong>{t("Tu préfères une autre solution ?", "Would you prefer another option?")}</strong><p>{t("Contacte-nous directement : nous étudierons avec toi une alternative.", "Contact us directly and we will discuss an alternative with you.")}</p><Link to={`${prefix}/contact?subject=partnership`}>{t("Contacter ToolTrim →", "Contact ToolTrim →")}</Link></div>
              <div className="sp-actions sp-actions--split"><button type="button" className="tt-button-secondary" onClick={() => { setPlanChoice(null); setStatus("idle"); }}>{t("← Revoir les options", "← Review options")}</button><button type="button" className="tt-button-secondary" onClick={() => { setStep(1); setStatus("idle"); }}>{t("← Modifier les informations", "← Edit information")}</button></div>
            </section>
          )}

          {step === 2 && planChoice === "free" && (
            <section className="sp-form">
              <div className="sp-section-heading"><span>02</span><div><h2>{t("Installer le badge de visibilité ToolTrim", "Install the ToolTrim visibility badge")}</h2><p>{t("Ce badge fait découvrir ToolTrim à ton audience et confirme le lien entre nos deux sites avant la validation finale.", "This badge introduces ToolTrim to your audience and confirms the connection between our websites before final confirmation.")}</p></div></div>
              <div className="sp-verification-panel">
                <div className="sp-badge-themes" role="group" aria-label={t("Version du badge", "Badge version")}>
                  <button type="button" className={badgeTheme === "light" ? "sp-badge-theme--active" : ""} onClick={() => { setBadgeTheme("light"); setSubmission((current) => ({ ...current, verificationToken: "" })); }}>☀︎ Light</button>
                  <button type="button" className={badgeTheme === "dark" ? "sp-badge-theme--active" : ""} onClick={() => { setBadgeTheme("dark"); setSubmission((current) => ({ ...current, verificationToken: "" })); }}>☾ Dark</button>
                </div>
                <div className={`sp-badge-preview sp-badge-preview--${badgeTheme}`}>
                  <img src={`/${badgeAsset}`} alt={badgeAlt} width={216} height={54} />
                </div>
                <p className="sp-embed-label">{t("Ajoute ce code sur ton site", "Add this code to your website")}</p>
                <div className="sp-code-wrap">
                  <code className="sp-code">{badgeHtml}</code>
                  <button type="button" className="sp-copy-button" onClick={copyBadgeCode} aria-label={t("Copier le code du badge", "Copy badge code")}>{codeCopied ? "✓" : "⧉"}</button>
                </div>
                <label className="sp-installed-check">
                  <input type="checkbox" checked={badgeInstalled} onChange={(event) => setBadgeInstalled(event.target.checked)} />
                  <span>{t("J’ai ajouté le badge sur mon site", "I've added the badge to my website")}</span>
                </label>
                <div className="tt-form-field"><label className="tt-form-label" htmlFor="submit-badge-url">{t("URL exacte de la page avec le badge", "Exact URL of the page with the badge")}</label><input ref={badgeUrlRef} className="tt-form-input" id="submit-badge-url" required type="url" value={submission.badgeUrl} onChange={(e) => { update("badgeUrl", e.target.value); update("verificationToken", ""); }} placeholder={`${submission.toolUrl.replace(/\/$/, "") || "https://example.com"}/partners`} aria-describedby={error ? "submit-badge-error" : undefined} /></div>
                {badgeVerified && <div className="sp-verified">✓ {t("Badge vérifié — soumission débloquée", "Badge verified — submission unlocked")}</div>}
              </div>
              {error && <p id="submit-badge-error" className="tt-form-error" role="alert">{error}</p>}
              <div className="sp-actions sp-actions--split"><button type="button" className="tt-button-secondary" onClick={() => { setPlanChoice(null); setStatus("idle"); }}>{t("← Revoir les options", "← Review options")}</button><button type="button" className="tt-button-primary" disabled={!badgeInstalled || status === "checking"} onClick={verifyBadge}>{status === "checking" ? t("Validation du badge…", "Validating badge…") : t("Valider le badge et continuer →", "Validate badge and continue →")}</button></div>
            </section>
          )}

          {step === 3 && (
            <form onSubmit={handleFinalSubmit} className="sp-form">
              <div className="sp-section-heading"><span>03</span><div><h2>{t("Finaliser ta fiche", "Finish your listing")}</h2><p>{paid ? t("Le paiement est confirmé. Dis-nous qui tu es et présente l'outil avant l'envoi.", "Payment confirmed. Tell us who you are and introduce the tool before sending.") : t("Le badge est en place. Dis-nous qui tu es et présente l'outil avant l'envoi.", "The badge is in place. Tell us who you are and introduce the tool before sending.")}</p></div></div>
              <div className="sp-verified">{paid ? t("Paiement reçu — publication garantie", "Payment received — publication guaranteed") : t("Badge vérifié sur le site présenté", "Badge verified on the submitted website")}</div>
              <dl className="sp-summary"><div><dt>{t("Outil", "Tool")}</dt><dd>{submission.toolName}</dd></div><div><dt>{t("Site", "Website")}</dt><dd>{submission.toolUrl}</dd></div><div><dt>Email</dt><dd>{submission.email}</dd></div>{!paid && <div><dt>{t("Page du badge", "Badge page")}</dt><dd>{submission.badgeUrl}</dd></div>}</dl>
              <div className="tt-form-field"><label className="tt-form-label" htmlFor="submit-role">{t("Ton lien avec l'outil", "Your relationship to the tool")}</label><div className="sp-input-wrap"><Briefcase size={16} className="sp-input-icon" /><select className="tt-form-input" id="submit-role" required value={submission.submitterRole} onChange={(e) => update("submitterRole", e.target.value)}><option value="" disabled>{t("Sélectionner…", "Select…")}</option><option value="founder">{t("Fondateur·rice / équipe", "Founder / team")}</option><option value="user">{t("Utilisateur·rice", "User")}</option><option value="agency">{t("Agence / partenaire", "Agency / partner")}</option><option value="other">{t("Autre", "Other")}</option></select></div></div>
              <div className="tt-form-field"><label className="tt-form-label" htmlFor="submit-name">{t("Ton nom", "Your name")}</label><div className="sp-input-wrap"><User size={16} className="sp-input-icon" /><input className="tt-form-input" id="submit-name" required maxLength={100} autoComplete="name" value={submission.name} onChange={(e) => update("name", e.target.value)} /></div></div>
              <div className="tt-form-field">
                <label className="tt-form-label" htmlFor="submit-description">{t("Description courte", "Short description")}</label>
                <div className="sp-input-wrap sp-input-wrap--textarea"><MessageSquare size={16} className="sp-input-icon" /><textarea className="tt-form-input tt-form-textarea" id="submit-description" required maxLength={2000} rows={6} value={submission.message} onChange={(e) => update("message", e.target.value)} placeholder={t("À qui s'adresse l'outil, quel problème résout-il et qu'est-ce qui le distingue ?", "Who is the tool for, what problem does it solve, and what makes it different?")} /></div>
                <span className="sp-char-count">{submission.message.length} / 2000</span>
              </div>
              {paid && (
                <div className="sp-editor-card">
                  <span className="sp-editor-avatar">MB</span>
                  <div className="sp-editor-body">
                    <p className="sp-editor-name">{t("Michael, fondateur de ToolTrim", "Michael, ToolTrim's founder")}</p>
                    <p className="sp-editor-text">{t(
                      "Je m'occupe personnellement de chaque publication payante. Avant la mise en ligne, je te montre ta fiche : tu me dis ce qui doit changer, j'ajuste, puis je publie. Une seule tournée d'aller-retour, pour garder les délais courts.",
                      "I personally handle every paid listing. Before it goes live, I'll show you the draft: tell me what needs to change, I'll adjust it, then publish. One round of back-and-forth, to keep turnaround fast.",
                    )}</p>
                    <a
                      className="sp-editor-link"
                      href={`mailto:contact@tooltrim.com?subject=${encodeURIComponent(t(`À propos de la publication de ${submission.toolName || "mon outil"}`, `About the listing for ${submission.toolName || "my tool"}`))}`}
                    >
                      <Mail size={15} />{t("Écrire à Michael →", "Write to Michael →")}
                    </a>
                  </div>
                </div>
              )}
              <p className="sp-publication-note">{paid
                ? t("Après l'envoi, ToolTrim publiera ton outil : le paiement garantit la publication, sans passer par la revue éditoriale du badge gratuit.", "After submission, ToolTrim will publish your tool: payment guarantees publication, without going through the free badge's editorial review.")
                : t("Après l'envoi, ToolTrim analysera le site et les informations disponibles. Cette validation ne garantit pas la publication : elle confirme uniquement que la soumission est complète.", "After submission, ToolTrim will review the website and available information. This confirmation does not guarantee publication; it only confirms that the submission is complete.")}</p>
              {error && <p className="tt-form-error" role="alert">{error}</p>}
              <div className="sp-actions sp-actions--split">{!paid && <button type="button" className="tt-button-secondary" onClick={() => { setStep(2); setStatus("idle"); }}>{t("← Revoir le badge", "← Review badge")}</button>}<button type="submit" className="tt-button-primary" disabled={status === "submitting"}>{status === "submitting" ? t("Envoi…", "Submitting…") : t("Envoyer la soumission →", "Submit tool →")}</button></div>
            </form>
          )}
        </main>
      </div>
      </div>
      )}

      <section className="sp-faq">
        <div className="sp-faq-inner">
        <div className="sp-section-heading">
          <span>—</span>
          <div><h2>{t("Questions fréquentes", "Frequently asked questions")}</h2></div>
        </div>
        <div className="sd-faq-list">
          {SUBMIT_FAQ.map((item, i) => (
            <details
              key={i}
              className="sd-faq-item"
              open={openFaqIndex === i}
              onToggle={(e) => {
                if ((e.currentTarget as HTMLDetailsElement).open) setOpenFaqIndex(i);
                else if (openFaqIndex === i) setOpenFaqIndex(null);
              }}
            >
              <summary className="sd-faq-summary">
                {t(item.q, item.qEn)}
                <ChevronDown size={16} className="sd-faq-icon" />
              </summary>
              <p className="sd-faq-answer">{t(item.a, item.aEn)}</p>
            </details>
          ))}
        </div>
        </div>
      </section>
    </div>
  );
};

export default SubmitToolPage;
