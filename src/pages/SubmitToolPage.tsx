import { FormEvent, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Breadcrumb from "@/components/Breadcrumb";
import { useLang } from "@/hooks/useLang";
import { cleanupSeo, SEO_BASE, setHreflang, setSeoTags } from "@/lib/seo";

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

const SubmitToolPage = () => {
  const { t, lang, prefix } = useLang();
  const [step, setStep] = useState<Step>(1);
  const [status, setStatus] = useState<Status>("idle");
  const [badgeTheme, setBadgeTheme] = useState<BadgeTheme>("light");
  const [badgeInstalled, setBadgeInstalled] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [error, setError] = useState("");
  const [submission, setSubmission] = useState<Submission>(EMPTY_SUBMISSION);
  const infoFormRef = useRef<HTMLFormElement>(null);
  const badgeUrlRef = useRef<HTMLInputElement>(null);
  const sentProgressRef = useRef(new Set<string>());

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

  const sendProgressEmail = async (progressStep: 1 | 2) => {
    const signature = `${progressStep}:${JSON.stringify(submission)}`;
    if (sentProgressRef.current.has(signature)) return;
    const endpoint = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
      ? "https://tooltrim.com/api/submission-progress"
      : "/api/submission-progress";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...submission, progressStep, lang }),
    });
    if (!response.ok) throw new Error("progress_email_failed");
    sentProgressRef.current.add(signature);
  };

  const continueToBadge = async (event: FormEvent<HTMLFormElement>) => {
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
          badgeReview: true,
        }),
      });
      if (!response.ok) throw new Error("submit_failed");
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
      <div className="sp-page">
        <section className="sp-success">
          <span className="tt-page-hero-eyebrow">{t("Soumission reçue", "Submission received")}</span>
          <h1>{t("Merci. Nous allons analyser le site.", "Thank you. We will review the website.")}</h1>
          <p>{t(
            "Le badge a été vérifié et la soumission est complète. Nous étudierons l'outil, ses informations et son intérêt pour les utilisateurs de ToolTrim avant toute publication.",
            "The badge was verified and the submission is complete. We will review the tool, its information, and its value for ToolTrim users before any publication.",
          )}</p>
          <Link to={`${prefix}/tools`} className="tt-button-primary">{t("Explorer les outils →", "Explore tools →")}</Link>
        </section>
      </div>
    );
  }

  return (
    <div className="sp-page">
      <header className="sp-hero">
        <Breadcrumb items={[{ label: t("Soumettre un outil", "Submit a tool") }]} />
        <span className="tt-page-hero-eyebrow">{t("Soumission d'un outil", "Tool submission")}</span>
        <h1>{t("Soumets ton outil à ToolTrim.", "Submit your tool to ToolTrim.")}</h1>
        <p>{t(
          "Cette démarche permet de soumettre ton produit à notre équipe. Une fois le dossier envoyé, nous analyserons le site, les fonctionnalités et les informations disponibles avant de décider d'une publication.",
          "This process lets you submit your product to our team. Once submitted, we will review the website, features, and available information before deciding whether to publish it.",
        )}</p>
      </header>

      <div className="sp-shell">
        <ol className="sp-steps" aria-label={t("Étapes de la soumission", "Submission steps")}>
          {[1, 2, 3].map((number) => (
            <li key={number} className={`${step === number ? "sp-step--active" : ""}${step > number ? " sp-step--done" : ""}`}>
              <span>{number}</span>
              <strong>{number === 1 ? t("Informations", "Information") : number === 2 ? "Badge" : t("Validation", "Confirmation")}</strong>
            </li>
          ))}
        </ol>

        <main className="sp-card">
          {step === 1 && (
            <form ref={infoFormRef} onSubmit={continueToBadge} className="sp-form">
              <div className="sp-section-heading">
                <span>01</span>
                <div><h2>{t("Informations sur l'outil", "Tool information")}</h2><p>{t("Donne-nous assez de contexte pour préparer l'analyse du site.", "Give us enough context to prepare the website review.")}</p></div>
              </div>
              <div className="sp-form-grid">
                <div className="tt-form-field"><label className="tt-form-label" htmlFor="submit-tool-name">{t("Nom de l'outil", "Tool name")}</label><input className="tt-form-input" id="submit-tool-name" required maxLength={100} value={submission.toolName} onChange={(e) => update("toolName", e.target.value)} placeholder="Acme" /></div>
                <div className="tt-form-field"><label className="tt-form-label" htmlFor="submit-tool-url">{t("Site officiel", "Official website")}</label><input className="tt-form-input" id="submit-tool-url" required type="url" maxLength={300} value={submission.toolUrl} onChange={(e) => update("toolUrl", e.target.value)} placeholder="https://…" /></div>
              </div>
              <div className="tt-form-field"><label className="tt-form-label" htmlFor="submit-role">{t("Ton lien avec l'outil", "Your relationship to the tool")}</label><select className="tt-form-input" id="submit-role" required value={submission.submitterRole} onChange={(e) => update("submitterRole", e.target.value)}><option value="" disabled>{t("Sélectionner…", "Select…")}</option><option value="founder">{t("Fondateur·rice / équipe", "Founder / team")}</option><option value="user">{t("Utilisateur·rice", "User")}</option><option value="agency">{t("Agence / partenaire", "Agency / partner")}</option><option value="other">{t("Autre", "Other")}</option></select></div>
              <div className="sp-form-grid">
                <div className="tt-form-field"><label className="tt-form-label" htmlFor="submit-name">{t("Ton nom", "Your name")}</label><input className="tt-form-input" id="submit-name" required maxLength={100} autoComplete="name" value={submission.name} onChange={(e) => update("name", e.target.value)} /></div>
                <div className="tt-form-field"><label className="tt-form-label" htmlFor="submit-email">Email</label><input className="tt-form-input" id="submit-email" required type="email" maxLength={200} autoComplete="email" value={submission.email} onChange={(e) => update("email", e.target.value)} placeholder="you@example.com" /></div>
              </div>
              <div className="tt-form-field"><label className="tt-form-label" htmlFor="submit-description">{t("Description courte", "Short description")}</label><textarea className="tt-form-input tt-form-textarea" id="submit-description" required maxLength={2000} rows={6} value={submission.message} onChange={(e) => update("message", e.target.value)} placeholder={t("À qui s'adresse l'outil, quel problème résout-il et qu'est-ce qui le distingue ?", "Who is the tool for, what problem does it solve, and what makes it different?")} /></div>
              {error && <p className="tt-form-error" role="alert">{error}</p>}
              <div className="sp-actions"><button type="submit" className="tt-button-primary" disabled={status === "saving"}>{status === "saving" ? t("Enregistrement…", "Saving…") : t("Continuer vers le badge →", "Continue to badge →")}</button></div>
            </form>
          )}

          {step === 2 && (
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
              <div className="sp-note"><strong>{t("Tu préfères une autre solution ?", "Would you prefer another option?")}</strong><p>{t("Contacte-nous directement : nous étudierons avec toi une alternative au badge.", "Contact us directly and we will discuss an alternative to the badge with you.")}</p><Link to={`${prefix}/contact?subject=partnership`}>{t("Contacter ToolTrim →", "Contact ToolTrim →")}</Link></div>
              {error && <p id="submit-badge-error" className="tt-form-error" role="alert">{error}</p>}
              <div className="sp-actions sp-actions--split"><button type="button" className="sp-button-secondary" onClick={() => { setStep(1); setStatus("idle"); }}>{t("← Modifier les informations", "← Edit information")}</button><button type="button" className="tt-button-primary" disabled={!badgeInstalled || status === "checking"} onClick={verifyBadge}>{status === "checking" ? t("Validation du badge…", "Validating badge…") : t("Valider le badge et continuer →", "Validate badge and continue →")}</button></div>
            </section>
          )}

          {step === 3 && (
            <section className="sp-form">
              <div className="sp-section-heading"><span>03</span><div><h2>{t("Valider la soumission", "Confirm the submission")}</h2><p>{t("Le badge est en place. Vérifie les informations avant l'envoi.", "The badge is in place. Check the information before submitting.")}</p></div></div>
              <div className="sp-verified">{t("Badge vérifié sur le site présenté", "Badge verified on the submitted website")}</div>
              <dl className="sp-summary"><div><dt>{t("Outil", "Tool")}</dt><dd>{submission.toolName}</dd></div><div><dt>{t("Site", "Website")}</dt><dd>{submission.toolUrl}</dd></div><div><dt>{t("Soumis par", "Submitted by")}</dt><dd>{submission.name} · {submission.email}</dd></div><div><dt>{t("Page du badge", "Badge page")}</dt><dd>{submission.badgeUrl}</dd></div><div><dt>{t("Description", "Description")}</dt><dd>{submission.message}</dd></div></dl>
              <p className="sp-publication-note">{t("Après l'envoi, ToolTrim analysera le site et les informations disponibles. Cette validation ne garantit pas la publication : elle confirme uniquement que la soumission est complète.", "After submission, ToolTrim will review the website and available information. This confirmation does not guarantee publication; it only confirms that the submission is complete.")}</p>
              {error && <p className="tt-form-error" role="alert">{error}</p>}
              <div className="sp-actions sp-actions--split"><button type="button" className="sp-button-secondary" onClick={() => { setStep(2); setStatus("idle"); }}>{t("← Revoir le badge", "← Review badge")}</button><button type="button" className="tt-button-primary" disabled={status === "submitting"} onClick={submit}>{status === "submitting" ? t("Envoi…", "Submitting…") : t("Envoyer la soumission →", "Submit tool →")}</button></div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default SubmitToolPage;
