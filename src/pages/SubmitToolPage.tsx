import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Breadcrumb from "@/components/Breadcrumb";
import ToolLogo from "@/components/ToolLogo";
import { useLang } from "@/hooks/useLang";
import { ArrowRight, Check, Clock, Copy, CreditCard, FileText, Globe, Mail, Scale, ShieldCheck, StarSolid, User } from "@/lib/icons";
import { cleanupSeo, SEO_BASE, setHreflang, setSeoTags } from "@/lib/seo";
import { trackEvent } from "@/lib/analytics";

type Step = 1 | 2 | 3;
type Status = "idle" | "saving" | "checking" | "submitting" | "success" | "error";
type ReviewPlan = "free" | "paid" | null;
type Submission = {
  toolName: string; toolUrl: string; submitterRole: string; name: string;
  email: string; message: string; badgeUrl: string; verificationToken: string;
};

const EMPTY_SUBMISSION: Submission = {
  toolName: "", toolUrl: "", submitterRole: "", name: "",
  email: "", message: "", badgeUrl: "", verificationToken: "",
};
const DRAFT_KEY = "tt_submit_draft";
const PAYMENT_URL = "https://www.creem.io/payment/prod_2LMoN4zyRhNAb53r3rWpwX";

const SubmitToolPage = () => {
  const { t, lang, prefix } = useLang();
  const [searchParams, setSearchParams] = useSearchParams();
  const [plan, setPlan] = useState<ReviewPlan>(null);
  const [step, setStep] = useState<Step>(1);
  const [status, setStatus] = useState<Status>("idle");
  const [paid, setPaid] = useState(false);
  const [badgeTheme, setBadgeTheme] = useState<"light" | "dark">("light");
  const [badgeInstalled, setBadgeInstalled] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [error, setError] = useState("");
  const [submission, setSubmission] = useState<Submission>(EMPTY_SUBMISSION);
  const badgeUrlRef = useRef<HTMLInputElement>(null);
  const sentProgressRef = useRef(new Set<string>());

  useEffect(() => {
    if (searchParams.get("paid") !== "1") return;
    let draft: Submission | null = null;
    try {
      const stored = window.localStorage.getItem(DRAFT_KEY);
      if (stored) draft = JSON.parse(stored) as Submission;
      window.localStorage.removeItem(DRAFT_KEY);
    } catch { draft = null; }
    if (draft?.toolName) {
      setSubmission(draft); setPaid(true); setPlan("paid"); setStep(3);
    } else {
      setError(t(
        "Paiement reçu, mais les informations de l'outil n'ont pas été retrouvées. Contacte-nous avec le reçu.",
        "Payment received, but the tool details could not be recovered. Contact us with the receipt.",
      ));
    }
    const next = new URLSearchParams(searchParams); next.delete("paid"); setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, t]);

  useEffect(() => {
    if (document.querySelector('script[src="https://www.creem.io/embed.js"]')) return;
    const script = document.createElement("script");
    script.src = "https://www.creem.io/embed.js"; script.async = true; document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!plan) return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById("submit-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [plan]);

  useEffect(() => {
    setSeoTags({
      title: t("Faire évaluer son outil | ToolTrim", "Get your tool reviewed | ToolTrim"),
      description: t(
        "Fais évaluer ton outil par ToolTrim et présente-le aux freelances et petites équipes qui comparent leur prochaine solution.",
        "Get independently reviewed by ToolTrim and reach freelancers and small teams comparing their next software choice.",
      ),
      url: `${SEO_BASE}/${lang}/submit`,
    });
    setHreflang(`/${lang}/submit`); return () => cleanupSeo([]);
  }, [lang, t]);

  const update = (field: keyof Submission, value: string) => {
    setSubmission((current) => ({ ...current, [field]: value })); setError("");
    if (status === "error") setStatus("idle");
  };
  const source = submission.toolName.trim().toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "submitted-tool";
  const badgeAsset = badgeTheme === "dark" ? "tooltrim-badge-dark.svg" : "tooltrim-badge.svg";
  const badgeAlt = `Discover ToolTrim via ${submission.toolName || "this tool"}`;
  const escapedAlt = badgeAlt.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  const badgeHref = `https://tooltrim.com/?utm_source=${encodeURIComponent(source)}&utm_medium=badge&utm_campaign=tool_submission`;
  const badgeHtml = `<a target="_blank" href="${badgeHref}"><img src="https://tooltrim.com/${badgeAsset}" alt="${escapedAlt}" height="54" loading="lazy"></a>`;
  const price = t("29 $", "$29");

  const choosePlan = (next: Exclude<ReviewPlan, null>, source = "offers") => {
    setPlan(next); setPaid(false); setStep(1); setStatus("idle"); setError("");
    trackEvent("submit_plan_select", { plan: next, source });
  };
  const upgradeToPaid = () => {
    setPlan("paid"); setPaid(false); setStep(2); setStatus("idle"); setError("");
    trackEvent("submit_plan_upgrade", { from: "free", to: "paid", source: "badge_step" });
  };
  const sendProgress = async (progressStep: 1 | 2, paidPath = false) => {
    const signature = `${progressStep}:${paidPath}:${JSON.stringify(submission)}`;
    if (sentProgressRef.current.has(signature)) return;
    const endpoint = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)
      ? "https://tooltrim.com/api/submission-progress" : "/api/submission-progress";
    const response = await fetch(endpoint, {
      method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true,
      body: JSON.stringify({ ...submission, progressStep, paid: paidPath, lang }),
    });
    if (!response.ok) throw new Error("progress_email_failed");
    sentProgressRef.current.add(signature);
  };
  const continueFromContact = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try { if (new URL(submission.toolUrl).protocol !== "https:") throw new Error(); }
    catch { setStatus("error"); setError(t("Le site officiel doit utiliser une adresse https://.", "The official website must use an https:// address.")); return; }
    setStatus("saving"); setError("");
    try {
      await sendProgress(1, plan === "paid"); setStep(2); setStatus("idle");
      document.getElementById("submit-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch { setStatus("error"); setError(t("L'enregistrement a échoué. Réessaie.", "This step could not be saved. Try again.")); }
  };
  const copyBadge = async () => {
    try { await navigator.clipboard.writeText(badgeHtml); }
    catch {
      const area = document.createElement("textarea"); area.value = badgeHtml; area.style.position = "fixed"; area.style.opacity = "0";
      document.body.appendChild(area); area.select(); document.execCommand("copy"); area.remove();
    }
    setCodeCopied(true); window.setTimeout(() => setCodeCopied(false), 1800);
  };
  const verifyBadge = async () => {
    try {
      if (!submission.badgeUrl.trim() || new URL(submission.badgeUrl).protocol !== "https:") throw new Error("invalid_url");
    } catch { setStatus("error"); setError(t("Saisis l'URL publique complète de la page avec le badge.", "Enter the complete public URL of the page with the badge.")); badgeUrlRef.current?.focus(); return; }
    setStatus("checking"); setError("");
    try {
      const endpoint = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname) ? "https://tooltrim.com/api/verify-badge" : "/api/verify-badge";
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ badgeUrl: submission.badgeUrl, toolUrl: submission.toolUrl }) });
      const payload = await response.json().catch(() => ({})); if (!response.ok) throw new Error(payload.error || "badge_not_found");
      setSubmission((current) => ({ ...current, verificationToken: payload.token || "" }));
      await sendProgress(2); setStep(3); setStatus("idle");
    } catch (caught) {
      const reason = caught instanceof Error ? caught.message : "verification_failed"; setStatus("error");
      setError(reason === "badge_wrong_domain"
        ? t("L'URL du badge doit appartenir au site soumis.", "The badge URL must be on the submitted website.")
        : reason === "page_unreachable"
          ? t("La page indiquée est inaccessible.", "The page cannot be reached.")
          : t("Badge introuvable dans le HTML public de la page.", "Badge not found in the page's public HTML."));
    }
  };
  const beginCheckout = () => {
    try { window.localStorage.setItem(DRAFT_KEY, JSON.stringify(submission)); } catch { /* recovery message covers this */ }
    trackEvent("submit_priority_checkout", { tool_name: submission.toolName, price: 29, currency: "USD" });
    void sendProgress(2, true).catch(() => undefined);
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setStatus("submitting"); setError("");
    try {
      const endpoint = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname) ? "https://tooltrim.com/api/contact" : "/api/contact";
      const response = await fetch(endpoint, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...submission, subject: t("Soumission d'un outil", "Tool submission"), submissionType: "tool", badgeReview: plan === "free", paid, lang }),
      });
      if (!response.ok) throw new Error();
      trackEvent("submit_tool", { tool_name: submission.toolName, submitter_role: submission.submitterRole, plan: paid ? "paid" : "free" });
      setStatus("success");
    } catch { setStatus("error"); setError(t("L'envoi n'a pas abouti. Réessaie ou contacte-nous.", "The submission could not be sent. Try again or contact us.")); }
  };

  if (status === "success") return (
    <div className="stp-page"><section className="sp-success">
      <span className="tt-page-hero-eyebrow">{t("Demande reçue", "Request received")}</span>
      <h1>{paid ? t("Ta publication prioritaire est lancée.", "Your priority publication is underway.") : t("Ton outil rejoint la file éditoriale.", "Your tool is in the editorial queue.")}</h1>
      <p>{paid
        ? t("Ton outil sera publié sous cinq jours ouvrés, sans badge requis. Le paiement n'influence ni le verdict ni le classement.", "Your tool will be published within five business days, with no badge required. Payment does not influence the verdict or ranking.")
        : t("Le badge est vérifié. Nous allons évaluer l'intérêt de l'outil pour les lecteurs avant toute publication.", "The badge is verified. We'll assess the tool's value for readers before any publication.")}</p>
      <Link to={`${prefix}/tools`} className="tt-button-primary">{t("Explorer les outils →", "Explore tools →")}</Link>
    </section></div>
  );

  return <div className="stp-page">
    <header className="sp-hero">
      <div className="sp-hero-crumb"><Breadcrumb items={[{ label: t("Soumettre un outil", "Submit a tool") }]} /></div>
      <div className="sp-pitch">
        <div className="sp-pitch-copy">
          <span className="tt-page-hero-eyebrow">{t("Pour les créateurs d’outils SaaS", "For SaaS builders")}</span>
          <h1>{lang === "fr" ? <>Fais de ton outil un choix crédible. <span className="tt-title-muted">Auprès des freelances et petites équipes.</span></> : <>Make your tool a credible choice. <span className="tt-title-muted">For freelancers and small teams.</span></>}</h1>
          <p className="sp-pitch-lead">{t("ToolTrim prépare et publie une fiche claire de ton produit : usages, tarifs, alternatives, note expliquée, verdict éditorial et lien direct vers ton site.", "ToolTrim prepares and publishes a clear product listing: use cases, pricing, alternatives, an explained score, an editorial verdict, and a direct link to your website.")}</p>
          <div className="sp-hero-actions">
            <button type="button" className="tt-button-primary" onClick={() => choosePlan("paid", "hero")}>{t(`Publier ma fiche · ${price}`, `Publish my listing · ${price}`)}<ArrowRight size={16} /></button>
            <a className="sp-text-link" href="#submit-plans-title">{t("Ou choisir la formule gratuite avec badge", "Or choose the free option with a badge")}<ArrowRight size={15} /></a>
          </div>
          <p className="sp-pitch-reassurance"><Clock size={15} />{t("Offre de rentrée : 29 $ jusqu’au 30 septembre · sans badge ni abonnement", "Back-to-work offer: $29 until September 30 · no badge or subscription")}</p>
        </div>
        <aside className="sp-listing-preview" aria-label={t("Exemple de fiche publiée : CommuteBar", "Published listing example: CommuteBar")}>
          <div className="sp-preview-caption"><FileText size={16} />{t("CE QUE TU REÇOIS", "WHAT YOU GET")}</div>
          <div className="sp-preview-identity"><ToolLogo tool={{ name: "CommuteBar", slug: "commutebar", websiteUrl: "https://commute.bar/" }} size={40} /><div><strong>CommuteBar</strong><span>{t("Le temps de trajet Apple Maps dans la barre des menus", "Apple Maps commute times in the Mac menu bar")}</span></div></div>
          <p className="sp-example-description">{t("Une fiche qui confronte le gain quotidien, la licence à vie et les limites d’un outil Mac spécialisé.", "A listing that weighs the daily time saved, lifetime price, and limits of a focused Mac utility.")}</p>
          <ul className="sp-example-topics"><li>{t("Une note ToolTrim et les faits qui l’expliquent", "A ToolTrim score and the facts behind it")}</li><li>{t("Tarifs et alternatives", "Pricing and alternatives")}</li><li>{t("Avis éditorial ToolTrim", "ToolTrim’s editorial assessment")}</li></ul>
          <Link className="sp-example-link" to={`${prefix}/tool/commutebar`}>{t("Voir la fiche et son scoring", "View the listing and its score")}<ArrowRight size={17} /></Link>
        </aside>
      </div>
      <div className="sp-proof-line">
        <div><strong>{t("Sous 5 jours", "Within 5 days")}</strong><span>{t("délai de publication", "publication turnaround")}</span></div>
        <div><strong>DR 31</strong><span>{t("Domain Rating · septembre 2026", "Domain Rating · September 2026")}</span></div>
        <div><strong>{t("Lien dofollow", "Dofollow link")}</strong><span>{t("vers le site officiel", "to the official website")}</span></div>
      </div>
    </header>

    <div className="sp-page-body">
      <section className="sp-overview" aria-labelledby="submit-plans-title"><div className="sp-overview-inner">
        <div className="sp-overview-heading"><span className="tt-page-hero-eyebrow">{t("Deux délais, une même indépendance", "Two timelines, the same independence")}</span><h2 id="submit-plans-title">{lang === "fr" ? <>Choisis ton délai. <span className="tt-title-muted">L’évaluation reste indépendante.</span></> : <>Choose your timeline. <span className="tt-title-muted">The assessment stays independent.</span></>}</h2><p>{t("Chaque fiche publiée reçoit le même traitement éditorial et une note ToolTrim expliquée. La formule à 29 $ garantit simplement le délai de publication.", "Every published listing gets the same editorial treatment and an explained ToolTrim score. The $29 option simply guarantees the publication timeline.")}</p></div>
        <div className="sp-plan-grid">
          <article className="sp-plan-card sp-plan-card--highlight">
            <span className="sp-plan-tag"><Clock size={14} />{t("LE PLUS DIRECT · OFFRE JUSQU’AU 30 SEPTEMBRE", "MOST DIRECT · OFFER UNTIL SEPTEMBER 30")}</span>
            <div className="sp-plan-card-head"><div><span className="sp-plan-price">{price}</span><span className="sp-plan-period">{t("une seule fois", "just once")}</span></div><span className="sp-plan-name">{t("Fiche publiée sous 5 jours", "Listing published within 5 days")}</span></div>
            <p className="sp-plan-desc">{t("Le chemin court pour obtenir une fiche complète, sans rien installer sur ton site.", "The shortest path to a complete listing, with nothing to install on your website.")}</p>
            <ul className="sp-plan-args"><li><User size={16} />{t("Fiche préparée par ToolTrim", "Listing prepared by ToolTrim")}</li><li><StarSolid size={16} />{t("Note ToolTrim expliquée par des faits", "ToolTrim score explained with supporting facts")}</li><li><Check size={16} />{t("Un aller-retour pour vérifier les faits", "One round to check the facts")}</li><li><Clock size={16} />{t("Publication garantie sous cinq jours ouvrés", "Publication guaranteed within five business days")}</li></ul>
            <button type="button" className="tt-button-primary sp-plan-cta" onClick={() => choosePlan("paid")}>{t(`Obtenir la publication prioritaire · ${price} →`, `Get priority publication · ${price} →`)}</button>
          </article>
          <article className="sp-plan-card">
            <span className="sp-plan-tag sp-plan-tag--quiet">{t("GRATUIT · AVEC BADGE", "FREE · WITH A BADGE")}</span>
            <div className="sp-plan-card-head"><div><span className="sp-plan-price">{t("0 $", "$0")}</span><span className="sp-plan-period">{t("sans paiement", "no payment")}</span></div><span className="sp-plan-name">{t("Revue éditoriale standard", "Standard editorial review")}</span></div>
            <p className="sp-plan-desc">{t("Pour proposer ton outil sans budget et rejoindre notre file de sélection.", "Submit your tool without a budget and join our standard selection queue.")}</p>
            <ul className="sp-plan-args"><li><Check size={16} />{t("Badge ToolTrim requis sur ton site", "ToolTrim badge required on your website")}</li><li><StarSolid size={16} />{t("Fiche et note ToolTrim si l’outil est retenu", "Listing and ToolTrim score if the tool is selected")}</li><li><Check size={16} />{t("Revue dans la file standard", "Review in the standard queue")}</li><li><Check size={16} />{t("Publication selon les critères éditoriaux", "Publication based on editorial criteria")}</li></ul>
            <button type="button" className="tt-button-secondary sp-plan-cta" onClick={() => choosePlan("free")}>{t("Rejoindre la revue standard →", "Join the standard review →")}</button>
          </article>
        </div>
        <aside className="sp-rating-proof" id="submit-score" aria-label={t("Présentation de la note ToolTrim", "ToolTrim score overview")}>
          <div className="sp-rating-proof-copy">
            <span className="tt-page-hero-eyebrow">{t("LE SCORE TOOLTRIM", "THE TOOLTRIM SCORE")}</span>
            <h3>{lang === "fr" ? <>Aide ta cible à choisir ton outil. <span className="tt-title-muted">Avec une note claire et argumentée.</span></> : <>Help your audience choose your tool. <span className="tt-title-muted">With a clear, reasoned score.</span></>}</h3>
            <p>{t("Nous évaluons ce que ton outil apporte aux freelances, indépendants et petites équipes : son utilité réelle, sa simplicité au quotidien et la liberté de changer de solution. Chaque note est expliquée. Le paiement ne change jamais le résultat.", "We assess what your tool brings to freelancers, solopreneurs, and small teams: real usefulness, everyday simplicity, and the freedom to switch. Every score is explained. Payment never changes the result.")}</p>
          </div>
          <div className="sp-rating-example">
            <div className="sp-rating-example-head"><div><span>{t("EXEMPLE PUBLIÉ", "PUBLISHED EXAMPLE")}</span><strong>CommuteBar</strong></div><div className="sp-rating-total"><StarSolid size={17} /><strong>3.8</strong><span>/5 · {t("Très bon", "Great")}</span></div></div>
            <p className="sp-rating-example-note">{t("Utile et simple pour les indépendants qui veulent rester concentrés pendant leurs appels. Sa note reste mesurée, car l’outil est spécialisé et réservé au Mac.", "Useful and simple for independent professionals who want to stay focused during calls. Its score stays measured because the product is specialized and Mac-only.")}</p>
            <Link className="sp-rating-example-link" to={`${prefix}/tool/commutebar`}>{t("Voir les raisons de la note", "See what explains the score")}<ArrowRight size={15} /></Link>
          </div>
        </aside>
      </div></section>

      <section className="sp-delivery" aria-labelledby="submit-delivery-title">
        <div className="sp-section-intro"><h2 id="submit-delivery-title">{lang === "fr" ? <>Tu nous présentes ton outil. <span className="tt-title-muted">Nous prenons le relais.</span></> : <>Tell us about your tool. <span className="tt-title-muted">We take it from there.</span></>}</h2></div>
        <ol className="sp-delivery-grid">
          <li><span>01</span><h3>{t("Envoie les informations", "Share the details")}</h3><p>{t("L’URL, le nom de ton outil et ton email pour commencer, puis quelques précisions sur ton produit.", "Start with your tool’s URL, name, and your email, then add a little context about your product.")}</p></li>
          <li><span>02</span><h3>{t("Nous préparons la fiche", "We prepare the listing")}</h3><p>{t("Dans la formule à 29 $, un aller-retour avec le rédacteur te permet de vérifier les faits avant publication.", "The $29 option includes one round with the editor to check the facts before publication.")}</p></li>
          <li><span>03</span><h3>{t("Ton outil devient découvrable", "Your tool can be discovered")}</h3><p>{t("La fiche publiée rejoint le catalogue et donne aux lecteurs un accès à ton site.", "The published listing joins the catalogue and gives readers a link to your website.")}</p></li>
        </ol>
      </section>

      <section className="sp-assurance" aria-labelledby="submit-guarantees-title">
        <div className="sp-guarantees">
          <strong id="submit-guarantees-title">{t("Ce qui est garanti", "What is guaranteed")}</strong>
          <ul><li><Check size={15} />{t("Publication sous 5 jours ouvrés", "Publication within 5 business days")}</li><li><Check size={15} />{t("Fiche préparée par ToolTrim", "Listing prepared by ToolTrim")}</li><li><Check size={15} />{t("Vérification des faits avant publication", "Fact check before publication")}</li><li><Check size={15} />{t("Lien direct et aucun abonnement", "Direct link and no subscription")}</li></ul>
        </div>
        <div className="sp-editorial-rule"><Scale size={20} /><p><strong>{t("Une fiche crédible, un verdict indépendant.", "A credible listing, an independent verdict.")}</strong> {t("Le paiement couvre le service de publication. Le score, le classement et la conclusion éditoriale restent indépendants.", "Payment covers the publication service. Scores, rankings, and editorial conclusions remain independent.")} <Link to={`${prefix}/transparency`}>{t("Lire notre politique →", "Read our policy →")}</Link></p></div>
      </section>

      {plan && <section className="sp-shell" id="submit-form">
        <div className="sp-selected-plan"><span>{t("Ta formule", "Your option")} <strong>{plan === "paid" ? t(`Fiche publiée sous 5 jours · ${price}`, `Listing published within 5 days · ${price}`) : t("Avec badge · gratuit", "With a badge · free")}</strong></span><ShieldCheck size={18} /></div>
        <ol className="sp-steps" aria-label={t("Étapes de la soumission", "Submission steps")}>
          {[1, 2, 3].map((number) => (
            <li key={number} className="sp-step-item">
              <span className={`sp-step${step === number ? " sp-step--active" : ""}${step > number ? " sp-step--done" : ""}`}>
                <span className="sp-step-dot">{step > number ? <Check size={14} /> : number}</span>
                <strong>{number === 1 ? "Contact" : number === 2 ? plan === "paid" ? t("Paiement", "Payment") : "Badge" : t("Détails", "Details")}</strong>
              </span>
              {number < 3 && <span className={`sp-step-connector${step > number ? " sp-step-connector--filled" : ""}`} aria-hidden="true" />}
            </li>
          ))}
        </ol>
        <div className="sp-card">
          {step === 1 && <form onSubmit={continueFromContact} className="sp-form">
            <div className="sp-section-heading"><span>01</span><div><h2>{t("Commençons par ton outil.", "Let’s start with your tool.")}</h2><p>{t("Trois informations pour commencer. Tu pourras préciser les détails à la dernière étape.", "Three details to get started. You can add more context in the final step.")}</p></div></div>
            <div className="sp-form-grid"><div className="tt-form-field"><label className="tt-form-label" htmlFor="submit-tool-url">{t("Site officiel", "Official website")}</label><div className="sp-input-wrap"><Globe size={16} /><input className="tt-form-input" id="submit-tool-url" required type="url" maxLength={300} value={submission.toolUrl} onChange={(event) => update("toolUrl", event.target.value)} placeholder="https://…" /></div></div><div className="tt-form-field"><label className="tt-form-label" htmlFor="submit-tool-name">{t("Nom de l'outil", "Tool name")}</label><div className="sp-input-wrap"><User size={16} /><input className="tt-form-input" id="submit-tool-name" required maxLength={100} value={submission.toolName} onChange={(event) => update("toolName", event.target.value)} placeholder="Acme" /></div></div></div>
            <div className="tt-form-field"><label className="tt-form-label" htmlFor="submit-email">Email</label><div className="sp-input-wrap"><Mail size={16} /><input className="tt-form-input" id="submit-email" required type="email" maxLength={200} value={submission.email} onChange={(event) => update("email", event.target.value)} placeholder="you@example.com" /></div></div>
            {error && <p className="tt-form-error" role="alert">{error}</p>}
            <div className="sp-actions sp-actions--split"><button type="button" className="sp-button-secondary" onClick={() => setPlan(null)}>{t("← Revoir les offres", "← Review options")}</button><button type="submit" className="tt-button-primary" disabled={status === "saving"}>{status === "saving" ? t("Enregistrement…", "Saving…") : plan === "paid" ? t("Continuer vers le paiement →", "Continue to payment →") : t("Continuer vers le badge →", "Continue to the badge →")}</button></div>
          </form>}

          {step === 2 && plan === "paid" && <section className="sp-form">
            <div className="sp-section-heading"><span>02</span><div><h2>{t("Confirmer la publication prioritaire", "Confirm priority publication")}</h2><p>{t("Ton outil passe directement à la rédaction, sans installation sur ton site.", "Your tool goes directly to the editorial team, with nothing to install on your site.")}</p></div></div>
            <div className="sp-payment-summary"><div><span>{t("PUBLICATION PRIORITAIRE", "PRIORITY PUBLICATION")}</span><strong>{submission.toolName}</strong><small>{submission.toolUrl}</small></div><strong>{price}</strong></div>
            <div className="sp-payment-promise"><ShieldCheck size={20} /><p>{t("Après la rédaction de la fiche, tu disposes d'un aller-retour avec le rédacteur avant sa publication sous cinq jours ouvrés.", "Once the listing is drafted, you get one review round with the editor before publication within five business days.")}</p></div>
            <p className="sp-payment-urgency"><Clock size={15} />{t("Tarif de rentrée disponible jusqu’au 30 septembre 2026.", "Back-to-work price available until September 30, 2026.")}</p>
            <a href={PAYMENT_URL} data-creem-checkout className="tt-button-primary sp-payment-cta" onClick={beginCheckout}><CreditCard size={17} />{t(`Payer ${price} et lancer ma fiche`, `Pay ${price} and start my listing`)}</a>
            <p className="sp-payment-meta">{t("Paiement unique sécurisé par Creem. Aucun abonnement.", "Secure one-time payment via Creem. No subscription.")}</p>
            <div className="sp-actions"><button type="button" className="sp-button-secondary" onClick={() => setStep(1)}>{t("← Modifier les informations", "← Edit information")}</button></div>
          </section>}

          {step === 2 && plan === "free" && <section className="sp-form">
            <div className="sp-section-heading"><span>02</span><div><h2>{t("Installer le badge ToolTrim", "Install the ToolTrim badge")}</h2><p>{t("Il débloque la file standard sans influencer notre décision.", "It unlocks the standard queue without influencing our decision.")}</p></div></div>
            <div className="sp-verification-panel">
              <div className="sp-badge-themes" role="group" aria-label={t("Version du badge", "Badge version")}><button type="button" className={badgeTheme === "light" ? "sp-badge-theme--active" : ""} onClick={() => setBadgeTheme("light")}>{t("Clair", "Light")}</button><button type="button" className={badgeTheme === "dark" ? "sp-badge-theme--active" : ""} onClick={() => setBadgeTheme("dark")}>{t("Sombre", "Dark")}</button></div>
              <div className={`sp-badge-preview sp-badge-preview--${badgeTheme}`}><img src={`/${badgeAsset}`} alt={badgeAlt} width={216} height={54} /></div>
              <p className="sp-embed-label">{t("Ajoute ce code sur ton site", "Add this code to your website")}</p><div className="sp-code-wrap"><code className="sp-code">{badgeHtml}</code><button type="button" className="sp-copy-button" onClick={copyBadge} aria-label={t("Copier le code du badge", "Copy badge code")}>{codeCopied ? <Check size={17} /> : <Copy size={17} />}</button></div>
              <label className="sp-installed-check"><input type="checkbox" checked={badgeInstalled} onChange={(event) => setBadgeInstalled(event.target.checked)} />{t("J'ai ajouté le badge sur mon site", "I've added the badge to my website")}</label>
              <div className="tt-form-field"><label className="tt-form-label" htmlFor="submit-badge-url">{t("URL de la page avec le badge", "URL of the page with the badge")}</label><input ref={badgeUrlRef} className="tt-form-input" id="submit-badge-url" type="url" value={submission.badgeUrl} onChange={(event) => update("badgeUrl", event.target.value)} placeholder={`${submission.toolUrl.replace(/\/$/, "") || "https://example.com"}/partners`} /></div>
            </div>
            <aside className="sp-upgrade-note">
              <div><span>{t("Pas envie d'installer le badge ?", "Do not want to install the badge?")}</span><strong>{t("Passe à la publication prioritaire.", "Switch to priority publication.")}</strong><p>{t("Ta fiche est préparée par ToolTrim, avec un aller-retour avant publication sous cinq jours ouvrés.", "ToolTrim prepares your listing, with one review round before publication within five business days.")}</p></div>
              <button type="button" className="sp-upgrade-cta" onClick={upgradeToPaid}>{t(`Choisir la formule à ${price} →`, `Choose the ${price} option →`)}</button>
            </aside>
            {error && <p className="tt-form-error" role="alert">{error}</p>}
            <div className="sp-actions sp-actions--split"><button type="button" className="sp-button-secondary" onClick={() => setStep(1)}>{t("← Modifier", "← Edit")}</button><button type="button" className="tt-button-primary" disabled={!badgeInstalled || status === "checking"} onClick={verifyBadge}>{status === "checking" ? t("Validation…", "Validating…") : t("Valider et continuer →", "Validate and continue →")}</button></div>
          </section>}

          {step === 3 && <form className="sp-form" onSubmit={submit}>
            <div className="sp-section-heading"><span>03</span><div><h2>{t("Aide-nous à évaluer le produit", "Help us evaluate the product")}</h2><p>{t("Donne le contexte nécessaire à la revue éditoriale.", "Give us the context needed for the editorial review.")}</p></div></div>
            <div className="sp-verified"><Check size={16} />{paid ? t("Paiement confirmé : publication prioritaire", "Payment confirmed: priority publication") : t("Badge vérifié : file standard", "Badge verified: standard queue")}</div>
            <div className="tt-form-field"><label className="tt-form-label" htmlFor="submit-role">{t("Ton lien avec l'outil", "Your relationship to the tool")}</label><select className="tt-form-input" id="submit-role" required value={submission.submitterRole} onChange={(event) => update("submitterRole", event.target.value)}><option value="" disabled>{t("Sélectionner…", "Select…")}</option><option value="founder">{t("Fondateur·rice / équipe", "Founder / team")}</option><option value="user">{t("Utilisateur·rice", "User")}</option><option value="agency">{t("Agence / partenaire", "Agency / partner")}</option><option value="other">{t("Autre", "Other")}</option></select></div>
            <div className="tt-form-field"><label className="tt-form-label" htmlFor="submit-name">{t("Ton nom", "Your name")}</label><input className="tt-form-input" id="submit-name" required maxLength={100} value={submission.name} onChange={(event) => update("name", event.target.value)} /></div>
            <div className="tt-form-field"><label className="tt-form-label" htmlFor="submit-description">{t("Ce que nous devons comprendre", "What we should understand")}</label><textarea className="tt-form-input tt-form-textarea" id="submit-description" required maxLength={2000} rows={6} value={submission.message} onChange={(event) => update("message", event.target.value)} placeholder={t("À qui s'adresse l'outil, quel problème résout-il et qu'est-ce qui le distingue ?", "Who is the tool for, what problem does it solve, and what makes it different?")} /></div>
            <p className="sp-publication-note">{paid ? t("La publication est prioritaire. ToolTrim conserve le dernier mot sur le verdict et le contenu éditorial.", "Publication is prioritized. ToolTrim retains final say over the verdict and editorial content.") : t("ToolTrim choisit librement de publier et conserve le dernier mot sur le verdict. Les erreurs factuelles peuvent être corrigées.", "ToolTrim independently decides whether to publish and retains final say over the verdict. Factual errors can be corrected.")}</p>
            {error && <p className="tt-form-error" role="alert">{error}</p>}<div className="sp-actions"><button type="submit" className="tt-button-primary" disabled={status === "submitting"}>{status === "submitting" ? t("Envoi…", "Submitting…") : t("Envoyer pour revue →", "Submit for review →")}</button></div>
          </form>}
        </div>
      </section>}

      <section className="sp-faq-section" aria-labelledby="submit-faq-title">
        <div className="sp-section-intro"><span className="tt-page-hero-eyebrow">FAQ</span><h2 id="submit-faq-title">{lang === "fr" ? <>Tout savoir. <span className="tt-title-muted">Avant de publier ton outil.</span></> : <>Everything you need to know. <span className="tt-title-muted">Before publishing your tool.</span></>}</h2></div>
        <div className="sp-faq-list">
          <details><summary>{t("Que vais-je recevoir exactement ?", "What exactly will I receive?")}</summary><p>{t("Une fiche dédiée préparée par ToolTrim avec la présentation du produit, ses usages, ses tarifs, ses alternatives, une note expliquée par des faits, notre verdict éditorial et un lien vers ton site officiel.", "A dedicated listing prepared by ToolTrim with your product overview, use cases, pricing, alternatives, a score explained with supporting facts, our editorial verdict, and a link to your official website.")}</p></details>
          <details><summary>{t("Dois-je rédiger ma fiche moi-même ?", "Do I need to write my own listing?")}</summary><p>{t("Non. Tu nous transmets les informations sur ton produit et ToolTrim prépare la fiche. La publication prioritaire inclut un aller-retour pour vérifier les informations factuelles avant publication.", "No. You provide information about your product and ToolTrim prepares the listing. Priority publication includes one round to check factual information before publication.")}</p></details>
          <details><summary>{t("Dois-je fournir les textes et les visuels ?", "Do I need to provide copy and visuals?")}</summary><p>{t("Non. L’URL de ton produit et quelques informations suffisent pour commencer. ToolTrim rédige la fiche et utilise les éléments officiels disponibles ; tu peux signaler une erreur factuelle avant publication.", "No. Your product URL and a few details are enough to get started. ToolTrim writes the listing and uses available official assets; you can flag a factual error before publication.")}</p></details>
          <details><summary>{t("Que garantit la publication prioritaire ?", "What does priority publication guarantee?")}</summary><p>{t("La mise en ligne sous cinq jours ouvrés, sans badge à installer. Le verdict et le classement restent indépendants.", "Publication within five business days, with no badge to install. The verdict and ranking remain independent.")}</p></details>
          <details><summary>{t("Que se passe-t-il si le délai de cinq jours est dépassé ?", "What happens if the five-day deadline is missed?")}</summary><p>{t("Nous te contactons directement pour t’informer et finaliser la publication en priorité. Les conditions de remboursement applicables sont celles présentées par Creem au moment du paiement.", "We contact you directly with an update and prioritize completion of the listing. Any applicable refund terms are those shown by Creem at checkout.")}</p></details>
          <details><summary>{t("Le paiement peut-il améliorer le verdict ?", "Can payment improve the verdict?")}</summary><p>{t("Non. Le score, le verdict, les alternatives et le classement sont indépendants du paiement.", "No. The score, verdict, alternatives, and ranking are independent of payment.")}</p></details>
          <details><summary>{t("Le lien vers mon site est-il dofollow et permanent ?", "Is the link to my website dofollow and permanent?")}</summary><p>{t("Le lien vers le site officiel est publié en dofollow. Il reste présent tant que la fiche est publiée et que l’URL demeure valide ; ToolTrim peut mettre à jour ou retirer une fiche devenue obsolète ou non conforme.", "The official website link is published as dofollow. It remains while the listing is published and the URL stays valid; ToolTrim may update or remove a listing that becomes outdated or non-compliant.")}</p></details>
          <details><summary>{t("Quelle différence avec la soumission gratuite ?", "What's different about the free submission?")}</summary><p>{t("La version gratuite demande un badge et rejoint la file éditoriale standard. La formule prioritaire ne demande aucun badge et garantit la publication sous cinq jours ouvrés.", "The free version requires a badge and joins the standard editorial queue. Priority requires no badge and guarantees publication within five business days.")}</p></details>
          <details><summary>{t("Puis-je échanger avec le rédacteur avant publication ?", "Can I speak with the editor before publication?")}</summary><p>{t("Oui. La formule à 29 $ inclut un aller-retour pour corriger ou préciser les informations factuelles. La conclusion éditoriale reste celle de ToolTrim.", "Yes. The $29 option includes one review round to correct or clarify factual information. The editorial conclusion remains ToolTrim's.")}</p></details>
          <details><summary>{t("Puis-je mettre ma fiche à jour après sa publication ?", "Can I update my listing after publication?")}</summary><p>{t("Oui. Écris à contact@tooltrim.com avec les informations à actualiser. ToolTrim vérifie les changements factuels avant de mettre la fiche à jour.", "Yes. Email contact@tooltrim.com with the information that needs updating. ToolTrim verifies factual changes before updating the listing.")}</p></details>
          <details><summary>{t("La publication comprend-elle le français et l’anglais ?", "Does publication include French and English?")}</summary><p>{t("Oui. La fiche rejoint les versions française et anglaise du catalogue afin d’être accessible aux deux audiences de ToolTrim.", "Yes. The listing joins the French and English versions of the catalogue so it can reach both ToolTrim audiences.")}</p></details>
        </div>
      </section>
      <section className="sp-closing" aria-labelledby="submit-closing-title">
        <div><h2 id="submit-closing-title">{lang === "fr" ? <>Ta fiche peut être en ligne. <span className="tt-title-muted">Dès cette semaine.</span></> : <>Your listing can be live. <span className="tt-title-muted">As soon as this week.</span></>}</h2><p>{t("Offre de rentrée à 29 $ jusqu’au 30 septembre, sans badge ni abonnement.", "Back-to-work offer at $29 until September 30, with no badge or subscription.")}</p></div>
        <button type="button" className="tt-button-primary" onClick={() => choosePlan("paid", "closing")}>{t(`Publier ma fiche · ${price}`, `Publish my listing · ${price}`)}<ArrowRight size={16} /></button>
      </section>
      <p className="sp-contact-line">{t("Une question ou un projet de partenariat ?", "A question or partnership in mind?")} <Link className="sp-text-link" to={`${prefix}/contact?subject=partnership`}>{t("Parlons-en", "Let’s talk")}<ArrowRight size={15} /></Link></p>
    </div>
  </div>;
};

export default SubmitToolPage;
