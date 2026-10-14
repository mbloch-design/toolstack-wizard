import type React from "react";
import { FormEvent, MouseEvent, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Link } from "@/lib/routerLinks";
import Breadcrumb from "@/components/Breadcrumb";
import ToolLogo from "@/components/ToolLogo";
import { useLang } from "@/hooks/useLang";
import { ArrowRight, ArrowUpRight, Check, Clock, Copy, CreditCard, FileText, Gauge, Globe, Link2, Mail, Minus, PenLine, Scale, ShieldCheck, StarSolid, User } from "@/lib/icons";
import { cleanupSeo, SEO_BASE, setHreflang, setSeoTags } from "@/lib/seo";
import { trackEvent } from "@/lib/analytics";
import { normalizeSiteUrl, type NormalizeUrlFailure } from "@/lib/normalizeSiteUrl";
import { pickProofTools } from "@/lib/submitProofTools";
import { parseSubmitInvite } from "@/lib/submitInvite";
import toolsIndex from "@/data/tools_index.json";

const PROOF_TOOLS = pickProofTools(toolsIndex as { name?: string; slug?: string; websiteUrl?: string }[]);

type Step = 1 | 2 | 3;
type Status = "idle" | "saving" | "checking" | "submitting" | "success" | "error";
type ReviewPlan = "free" | "paid" | null;
type Submission = {
  toolName: string; toolUrl: string; submitterRole: string; name: string;
  email: string; message: string; badgeUrl: string; verificationToken: string;
  paymentReference: string; checkoutId: string; submissionId: string; attemptPayload: string;
};

const EMPTY_SUBMISSION: Submission = {
  toolName: "", toolUrl: "", submitterRole: "", name: "",
  email: "", message: "", badgeUrl: "", verificationToken: "", paymentReference: "", checkoutId: "", submissionId: "", attemptPayload: "",
};
const DRAFT_KEY = "tt_submit_draft";
const PAYMENT_URL = "https://www.creem.io/payment/prod_2LMoN4zyRhNAb53r3rWpwX";

const RECEIPT_KEY = "tt_submit_payment_return";
function parseDraft(value: string | null): Submission | null {
  try {
    const parsed = JSON.parse(value || "null");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const draft = { ...EMPTY_SUBMISSION, ...parsed };
    if (Object.keys(EMPTY_SUBMISSION).some((key) => typeof draft[key] !== "string")) return null;
    if (!draft.submissionId && /^[0-9a-f-]{36}$/i.test(draft.paymentReference)) draft.submissionId = draft.paymentReference;
    return draft;
  } catch { return null; }
}
function saveDraft(draft: Submission) {
  // Separate keys preserve overlapping tabs and non-primary-click navigation.
  if (draft.paymentReference) window.localStorage.setItem(`${DRAFT_KEY}:${draft.paymentReference}`, JSON.stringify(draft));
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}
function readDrafts(): Submission[] {
  const drafts: Submission[] = [];
  try {
    const current = parseDraft(window.localStorage.getItem(DRAFT_KEY));
    if (current) drafts.push(current);
    for (let index = 0; index < window.localStorage.length; index++) {
      const key = window.localStorage.key(index);
      if (!key?.startsWith(`${DRAFT_KEY}:`)) continue;
      const draft = parseDraft(window.localStorage.getItem(key));
      if (draft && !drafts.some((other) => other.paymentReference === draft.paymentReference)) drafts.push(draft);
    }
  } catch { /* Existing readable drafts remain usable. */ }
  return drafts;
}

const SubmitToolPage = () => {
  const { t, lang, prefix } = useLang();
  const [searchParams, setSearchParams] = useSearchParams();
  const [plan, setPlan] = useState<ReviewPlan>(null);
  const [step, setStep] = useState<Step>(1);
  const [status, setStatus] = useState<Status>("idle");
  const [paid, setPaid] = useState(false);
  const [paymentRecovery, setPaymentRecovery] = useState(false);
  const [paymentRetry, setPaymentRetry] = useState(0);
  const [badgeTheme, setBadgeTheme] = useState<"light" | "dark">("light");
  const [badgeInstalled, setBadgeInstalled] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [error, setError] = useState("");
  const [submission, setSubmission] = useState<Submission>(EMPTY_SUBMISSION);
  const badgeUrlRef = useRef<HTMLInputElement>(null);
  const submissionAcceptedRef = useRef(false);
  const sentProgressRef = useRef(new Set<string>());

  useEffect(() => {
    if (submissionAcceptedRef.current) return;
    const drafts = readDrafts();
    let savedReceipt = "";
    try { savedReceipt = window.localStorage.getItem(RECEIPT_KEY) || ""; } catch { /* URL recovery still works. */ }
    const checkoutId = searchParams.get("checkout_id") || savedReceipt || drafts.find((draft) => draft.checkoutId)?.checkoutId || "";
    if (searchParams.get("paid") !== "1" && !checkoutId) {
      const candidate=drafts[0];if(candidate)setSubmission(candidate);
      let attempted:Record<string,unknown>|undefined;
      try{if(candidate?.attemptPayload)attempted=JSON.parse(candidate.attemptPayload);}catch{/* Preserve the editable draft. */}
      if(candidate && attempted?.submissionType==='tool' && attempted.paid===false && attempted.submissionId===candidate.submissionId){
        const controller=new AbortController();
        const endpoint=/^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)?'https://tooltrim.com/api/contact':'/api/contact';
        void fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({...attempted,replayOnly:true})}).then(async response=>{
          const result=await response.json().catch(()=>({}));if(controller.signal.aborted||!response.ok||result.success!==true)return;
          submissionAcceptedRef.current=true;setPaid(false);
          try{if(parseDraft(window.localStorage.getItem(DRAFT_KEY))?.submissionId===candidate.submissionId)window.localStorage.removeItem(DRAFT_KEY);if(candidate.paymentReference)window.localStorage.removeItem(`${DRAFT_KEY}:${candidate.paymentReference}`);}catch{/* Accepted record remains durable. */}
          setStatus('success');
        }).catch(()=>{/* A missing/unavailable record leaves the full draft editable. */});
        return ()=>controller.abort();
      }
      return;
    }
    setPaymentRecovery(true); setPaid(false); setPlan("paid"); setStatus("checking"); setError("");
    const candidates = drafts.filter((draft) => draft.toolName && draft.paymentReference).sort((a,b)=>(b.checkoutId===checkoutId&&b.attemptPayload?1:0)-(a.checkoutId===checkoutId&&a.attemptPayload?1:0)).slice(0, 20);
    if (!candidates.length || !checkoutId) {
      setStatus("error");
      setError(t(
        "Les informations nécessaires à la vérification n’ont pas été retrouvées. Ne repaie pas : contacte contact@tooltrim.com avec ton reçu Creem.",
        "The details needed for verification could not be recovered. Do not pay again: email contact@tooltrim.com with your Creem receipt.",
      ));
      return;
    }
    try { window.localStorage.setItem(RECEIPT_KEY, checkoutId); } catch { /* Keep the receipt in the URL. */ }
    const controller = new AbortController();
    const endpoint = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)
      ? "https://tooltrim.com/api/verify-payment" : "/api/verify-payment";
    void (async () => {
      try {
        for (const candidate of candidates) {
          if(candidate.attemptPayload){
            let attempted:Record<string,unknown>|undefined;
            try{attempted=JSON.parse(candidate.attemptPayload);}catch{/* Legacy or damaged attempt follows normal verification. */}
            if(attempted?.submissionType==='tool' && attempted.submissionId===candidate.submissionId && attempted.checkoutId===checkoutId && attempted.paid===true){
              const replayEndpoint=/^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)?'https://tooltrim.com/api/contact':'/api/contact';
              const replay=await fetch(replayEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({...attempted,replayOnly:true})});
              const result=await replay.json().catch(()=>({}));
              if(controller.signal.aborted)return;
              if(replay.ok && result.success===true){
                submissionAcceptedRef.current=true;setPaid(true);
                try{if(parseDraft(window.localStorage.getItem(DRAFT_KEY))?.submissionId===candidate.submissionId)window.localStorage.removeItem(DRAFT_KEY);window.localStorage.removeItem(`${DRAFT_KEY}:${candidate.paymentReference}`);window.localStorage.removeItem(RECEIPT_KEY);}catch{/* Accepted state is durable. */}
                const next=new URLSearchParams(searchParams);for(const key of ['paid','checkout_id','order_id','customer_id','subscription_id','product_id','request_id','signature'])next.delete(key);setSearchParams(next,{replace:true});setStatus('success');return;
              }
              if(replay.status!==404)throw new Error('submission_recovery_unavailable');
            }
          }
          const response = await fetch(endpoint, {
            method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
            body: JSON.stringify({ checkoutId, paymentReference: candidate.paymentReference, toolUrl: candidate.toolUrl }),
          });
          const payload = await response.json().catch(() => ({}));
          if (controller.signal.aborted) return;
          if (response.status === 400) continue;
          if (!response.ok || payload.verified !== true) throw new Error("payment_unverified");
          const recovered = { ...candidate, checkoutId };
          setSubmission(recovered);
          try { saveDraft(recovered); } catch { /* Keep the receipt in the URL. */ }
          setPaid(true); setStep(3); setStatus("idle");
          return;
        }
        throw new Error("payment_unverified");
      } catch {
        if (controller.signal.aborted) return;
        setStatus("error");
        setError(t(
          "Le paiement n’a pas encore pu être vérifié. Ton brouillon est conservé. Ne repaie pas : réessaie la vérification ou contacte contact@tooltrim.com avec ton reçu.",
          "Payment could not yet be verified. Your draft is kept. Do not pay again: retry verification or email contact@tooltrim.com with your receipt.",
        ));
      }
    })();
    return () => controller.abort();
  }, [searchParams, t, paymentRetry]);

  const invite = parseSubmitInvite(searchParams);
  const inviteName = invite?.toolName || "";
  const inviteUrl = invite?.toolUrl || "";
  useEffect(() => {
    if (!inviteName) return;
    setSubmission((current) => ({ ...current, toolName: current.toolName || inviteName, toolUrl: current.toolUrl || inviteUrl }));
  }, [inviteName, inviteUrl]);

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
    setSubmission((current) => {
      const next = { ...current, [field]: value };
      if (paymentRecovery || next.submissionId) {
        try { saveDraft(next); } catch { /* Keep the current form usable. */ }
      }
      return next;
    }); setError("");
    if (status === "error") setStatus("idle");
  };
  const urlErrorMessage = (reason: NormalizeUrlFailure) => {
    if (reason === "empty") return t("Indique l'adresse du site.", "Enter the website address.");
    if (reason === "unsupported_scheme") return t("Indique une adresse de site web, pas un autre type de lien.", "Enter a website address, not another kind of link.");
    if (reason === "port_not_allowed") return t("Les adresses avec un numéro de port ne peuvent pas être vérifiées.", "Addresses with a port number cannot be verified.");
    return t("Cette adresse ne semble pas valide. Exemple : exemple.com", "This address does not look valid. Example: example.com");
  };
  /** Rewrites the field in place so the person sees exactly what we will fetch. */
  const tidyUrlField = (field: "toolUrl" | "badgeUrl") => {
    const current = submission[field];
    if (!current.trim()) return;
    const result = normalizeSiteUrl(current);
    if (result.ok && result.changed) update(field, result.url);
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
    trackEvent("submit_plan_select", { plan: next, source, personalized: Boolean(inviteName) });
  };
  const upgradeToPaid = () => {
    const next = { ...submission, submissionId: submission.submissionId || crypto.randomUUID(), paymentReference: submission.paymentReference || crypto.randomUUID(), checkoutId: "" };
    try { saveDraft(next); }
    catch { setError(t("Autorise le stockage du brouillon dans ce navigateur avant de continuer.", "Allow draft storage in this browser before continuing.")); return; }
    setSubmission(next);
    setPlan("paid"); setPaid(false); setStep(2); setStatus("idle"); setError("");
    trackEvent("submit_plan_upgrade", { from: "free", to: "paid", source: "badge_step" });
  };
  const sendProgress = async (progressStep: 1 | 2, paidPath = false, overrides: Partial<Submission> = {}) => {
    // State updates are not applied yet when this runs, so normalised values are passed in.
    const payload = { ...submission, ...overrides };
    const signature = `${progressStep}:${paidPath}:${JSON.stringify(payload)}`;
    if (sentProgressRef.current.has(signature)) return;
    const endpoint = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)
      ? "https://tooltrim.com/api/submission-progress" : "/api/submission-progress";
    const response = await fetch(endpoint, {
      method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true,
      body: JSON.stringify({ ...payload, progressStep, paid: paidPath, lang }),
    });
    if (!response.ok) throw new Error("progress_email_failed");
    sentProgressRef.current.add(signature);
  };
  const continueFromContact = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const site = normalizeSiteUrl(submission.toolUrl);
    if (!site.ok) { setStatus("error"); setError(urlErrorMessage(site.reason)); return; }
    if (site.changed) update("toolUrl", site.url);
    setStatus("saving"); setError("");
    try {
      const next = { ...submission, toolUrl: site.url, submissionId: submission.submissionId || crypto.randomUUID(), ...(plan === 'paid' ? { paymentReference: submission.paymentReference || crypto.randomUUID(), checkoutId: '' } : {}) };
      saveDraft(next); setSubmission(next);
      void sendProgress(1, plan === "paid", next).catch(() => undefined);
      setStep(2); setStatus("idle");
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
    const badgePage = normalizeSiteUrl(submission.badgeUrl);
    if (!badgePage.ok) {
      setStatus("error");
      setError(badgePage.reason === "empty"
        ? t("Saisis l'URL publique complète de la page avec le badge.", "Enter the complete public URL of the page with the badge.")
        : urlErrorMessage(badgePage.reason));
      badgeUrlRef.current?.focus();
      return;
    }
    if (badgePage.changed) update("badgeUrl", badgePage.url);
    setStatus("checking"); setError("");
    try {
      const endpoint = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname) ? "https://tooltrim.com/api/verify-badge" : "/api/verify-badge";
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ badgeUrl: badgePage.url, toolUrl: submission.toolUrl }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || (response.status >= 500 ? "server_unavailable" : "badge_not_found"));
      setSubmission((current) => ({ ...current, verificationToken: payload.token || "" }));
      const next = { ...submission, badgeUrl: badgePage.url, verificationToken: payload.token || "" };
      try { saveDraft(next); } catch { /* Final POST requires a complete recoverable draft. */ }
      void sendProgress(2, false, { badgeUrl: badgePage.url }).catch(() => undefined); setStep(3); setStatus("idle");
    } catch (caught) {
      const reason = caught instanceof TypeError ? "server_unavailable" : caught instanceof Error ? caught.message : "verification_failed";
      setStatus("error");
      setError(reason === "badge_wrong_domain"
        ? t("L'URL du badge doit appartenir au site soumis.", "The badge URL must be on the submitted website.")
        : reason === "page_unreachable"
          ? t("La page indiquée est inaccessible.", "The page cannot be reached.")
          : reason === "server_unavailable" || reason === "verification_unavailable"
            ? t("La vérification est momentanément indisponible de notre côté. Ton badge n'est pas en cause : réessaie dans quelques minutes ou écris à contact@tooltrim.com.", "Verification is temporarily unavailable on our side. Your badge is not the problem: try again in a few minutes or email contact@tooltrim.com.")
            : t("Badge introuvable dans le HTML public de la page.", "Badge not found in the page's public HTML."));
    }
  };
  const checkoutUrl = new URL(PAYMENT_URL);
  checkoutUrl.searchParams.set("metadata[tooltrim_submission_id]", submission.paymentReference);
  const checkoutSite = normalizeSiteUrl(submission.toolUrl);
  checkoutUrl.searchParams.set("metadata[tooltrim_tool_url]", checkoutSite.ok ? new URL(checkoutSite.url).href : "");
  const beginCheckout = (event: MouseEvent<HTMLAnchorElement>) => {
    try { saveDraft(submission); }
    catch {
      event.preventDefault(); event.stopPropagation();
      setError(t("Autorise le stockage du brouillon dans ce navigateur avant de continuer.", "Allow draft storage in this browser before continuing."));
      return;
    }
    trackEvent("submit_priority_checkout", { tool_name: submission.toolName, price: 29, currency: "USD" });
    void sendProgress(2, true).catch(() => undefined);
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setStatus("submitting"); setError("");
    try {
      const endpoint = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname) ? "https://tooltrim.com/api/contact" : "/api/contact";
      const { attemptPayload: _previousAttempt, ...fields } = submission;
      const attempted = { ...fields, subject: t("Soumission d'un outil", "Tool submission"), submissionType: "tool", badgeReview: plan === "free", paid, lang };
      const prepared = { ...submission, attemptPayload: JSON.stringify(attempted) };
      saveDraft(prepared); setSubmission(prepared);
      const response = await fetch(endpoint, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: prepared.attemptPayload,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.success !== true) throw new Error(payload.error || "submission_failed");
      trackEvent("submit_tool", { tool_name: submission.toolName, submitter_role: submission.submitterRole, plan: paid ? "paid" : "free" });
      submissionAcceptedRef.current = true;
      try {
        if (parseDraft(window.localStorage.getItem(DRAFT_KEY))?.paymentReference === submission.paymentReference) window.localStorage.removeItem(DRAFT_KEY);
        if (submission.paymentReference) window.localStorage.removeItem(`${DRAFT_KEY}:${submission.paymentReference}`);
        if (window.localStorage.getItem(RECEIPT_KEY) === submission.checkoutId) window.localStorage.removeItem(RECEIPT_KEY);
      } catch { /* Accepted submission remains successful. */ }
      const next = new URLSearchParams(searchParams);
      for (const key of ["paid", "checkout_id", "order_id", "customer_id", "subscription_id", "product_id", "request_id", "signature"]) next.delete(key);
      setSearchParams(next, { replace: true });
      setStatus("success");
    } catch (caught) {
      const reason = caught instanceof Error ? caught.message : "submission_failed";
      setStatus("error");
      setError(reason === "Badge must still be installed when the submission is sent"
        ? t("Le badge n’est plus détecté sur la page indiquée. Réinstalle-le avant d’envoyer le formulaire.", "The badge is no longer detected on the submitted page. Reinstall it before sending the form.")
        : t("L'envoi n'a pas abouti. Réessaie ou contacte-nous.", "The submission could not be sent. Try again or contact us."));
    }
  };

  if (status === "success") return (
    <div className="stp-page"><section className="sp-success">
      <span className="tt-page-hero-eyebrow">{t("Demande reçue", "Request received")}</span>
      <h1>{paid ? t("Ta fiche prioritaire est lancée.", "Your priority review is underway.") : t(`${submission.toolName || "Ton outil"} est dans la file de revue standard.`, `${submission.toolName || "Your tool"} is in the standard review queue.`)}</h1>
      <p>{paid
        ? t("Ton outil sera publié sous cinq jours ouvrés, sans badge requis. Le paiement n'influence ni le verdict ni le classement.", "Your tool will be published within five business days, with no badge required. Payment does not influence the verdict or ranking.")
        : t("Pas de délai fixe : nous évaluons les outils au fil de l’eau et ne publions que ceux que nous retenons. Garde le badge sur ton site tant que ta demande est en attente.", "No set timeline: we review tools as we can and publish only the ones we select. Keep the badge on your site while your request is pending.")}</p>
      {!paid && <aside className="sp-success-upsell" aria-labelledby="submit-success-upsell">
        <h2 id="submit-success-upsell">{t("Tu veux être en ligne sous 5 jours ouvrés ?", "Want it live within 5 business days?")}</h2>
        <ul>
          <li><Link2 size={16} /><strong>{t("Lien dofollow depuis un site DR 43", "Dofollow link from a DR 43 site")}</strong></li>
          <li><Check size={16} />{t("Publication garantie, sans attente", "Publication guaranteed, no queue")}</li>
          <li><Check size={16} />{t("Tu vérifies les faits avant publication", "You check the facts before it goes live")}</li>
        </ul>
        <button type="button" className="tt-button-primary" onClick={() => { setSubmission((current) => ({ ...current, submissionId: "", paymentReference: "", checkoutId: "", attemptPayload: "", verificationToken: "", badgeUrl: "" })); submissionAcceptedRef.current = false; setStatus("idle"); choosePlan("paid", "success_upsell"); }}>{t(`Passer à la fiche prioritaire · ${price}`, `Switch to the priority review · ${price}`)}<ArrowRight size={16} /></button>
      </aside>}
      <Link to={`${prefix}/tool/commutebar`} className="sp-success-link">{t("Voir une fiche publiée", "See a published review")}<ArrowRight size={15} /></Link>
    </section></div>
  );

  if (paymentRecovery && !paid) return (
    <div className="stp-page"><section className="sp-success" aria-live="polite">
      <h1>{t("Vérification du paiement", "Payment verification")}</h1>
      {status === "checking" ? <p>{t("Nous vérifions ton paiement auprès de Creem…", "We are verifying your payment with Creem…")}</p> : <>
        <p className="tt-form-error" role="alert">{error}</p>
        <button type="button" className="tt-button-primary" onClick={() => setPaymentRetry((current) => current + 1)}>{t("Réessayer la vérification", "Retry verification")}</button>
      </>}
      <p><a href="mailto:contact@tooltrim.com">contact@tooltrim.com</a></p>
    </section></div>
  );

  return <div className="stp-page">
    {!paymentRecovery && <header className="sp-hero">
      <div className="sp-hero-crumb"><Breadcrumb items={[{ label: t("Soumettre un outil", "Submit a tool") }]} /></div>
      <div className="sp-pitch">
        <div className="sp-pitch-copy">
          <span className="tt-page-hero-eyebrow">{inviteName ? t(`Pour l’équipe ${inviteName}`, `For the ${inviteName} team`) : t("Pour les créateurs d’outils SaaS", "For SaaS builders")}</span>
          <h1>{lang === "fr"
            ? <>Fais découvrir {inviteName || "ton produit"} <span className="tt-title-muted">aux gens qui choisissent leur prochain outil.</span></>
            : <>Get {inviteName || "your product"} found <span className="tt-title-muted">by people choosing their next tool.</span></>}</h1>
          <p className="sp-pitch-lead">{t("On rédige une fiche indépendante, publiée sous 5 jours ouvrés, avec un lien vers ton site. Tu n’as rien à écrire.", "We write an independent review, publish it within 5 business days and link it to your site. You don’t write a word.")}</p>
          <div className="sp-hero-actions">
            <button type="button" className="tt-button-primary" onClick={() => choosePlan("paid", "hero")}>{inviteName ? t(`Faire évaluer ${inviteName} · ${price}`, `Get ${inviteName} reviewed · ${price}`) : t(`Faire évaluer mon outil · ${price}`, `Get my tool reviewed · ${price}`)}<ArrowRight size={16} /></button>
            <a className="sp-hero-cta-secondary" href="#submit-plans-title">{t("Ou gratuitement, avec un badge ›", "Or submit free with a badge ›")}</a>
          </div>
          <p className="sp-pitch-reassurance"><ShieldCheck size={15} />{t("Tu vérifies les faits avant publication · paiement unique · sans badge", "You check the facts before it goes live · one-time payment · no badge")}</p>
          {inviteName && <p className="sp-founder-note">{t("Une question ? Réponds simplement à mon email. Michael, fondateur de ToolTrim", "Questions? Just reply to my email. Michael, founder of ToolTrim")}</p>}
        </div>
        <div className="sp-hero-visual" aria-hidden="true">
          <div className="sp-shot">
            <div className="sp-shot-bar"><span /><span /><span /><em>tooltrim.com/tool/{(inviteName || t("ton-outil", "your-tool")).toLowerCase().replace(/[^a-z0-9]+/g, "-")}</em></div>
            <div className="sp-shot-body">
              <div className="sp-shot-identity">
                <ToolLogo tool={{ name: inviteName || t("Ton outil", "Your tool"), slug: (inviteName || "your-tool").toLowerCase().replace(/[^a-z0-9]+/g, "-"), websiteUrl: inviteUrl || undefined }} size={48} />
                <div><strong>{inviteName || t("Ton outil", "Your tool")}</strong><span className="sp-shot-status"><i />{t("Fiche en cours de rédaction", "Review in progress")}</span></div>
              </div>
              <div className="sp-shot-tabs"><span>{t("Aperçu", "Overview")}</span><span>{t("Tarifs", "Pricing")}</span><span>{t("Alternatives", "Alternatives")}</span></div>
              <div className="sp-shot-lines"><span /><span /><span /></div>
              <div className="sp-shot-score"><span>{t("Note ToolTrim", "ToolTrim score")}</span><em>{t("après évaluation", "after review")}</em></div>
              <div className="sp-shot-cta">{t("Visiter le site", "Visit website")} ↗</div>
            </div>
          </div>
        </div>
      </div>
      <p className="sp-specs-label">{t(`Inclus dans l’offre à ${price}`, `Included in the ${price} review`)}</p>
      <dl className="sp-specs">
        <div><span className="sp-spec-icon"><Gauge size={20} /></span><dt>DR 43</dt><dd>{t("Domain Rating de tooltrim.com, octobre 2026", "Domain Rating of tooltrim.com, October 2026")}</dd></div>
        <div><span className="sp-spec-icon"><Link2 size={20} /></span><dt>Dofollow</dt><dd>{t("De ta fiche vers ton site. L’offre gratuite reste en nofollow.", "From your review to your site. Free submissions stay nofollow.")}</dd></div>
        <div><span className="sp-spec-icon"><Clock size={20} /></span><dt>{t("5 jours", "5 days")}</dt><dd>{t("Du paiement à la fiche publiée", "From payment to published review")}</dd></div>
        <div><span className="sp-spec-icon"><PenLine size={20} /></span><dt>{t("0 mot", "0 words")}</dt><dd>{t("À écrire de ton côté : on rédige tout", "For you to write: we draft everything")}</dd></div>
      </dl>
      <div className="sp-proof-row">
        <p className="sp-proof-row-title">{inviteName ? t(`${inviteName} rejoint plus de 1 200 outils comparés sur ToolTrim.`, `${inviteName} joins 1,200+ tools compared on ToolTrim.`) : t("Ton outil rejoint plus de 1 200 outils comparés sur ToolTrim.", "Your tool joins 1,200+ tools compared on ToolTrim.")}</p>
        <div className="sp-marquee">
          {[0, 1].map((copy) => (
            <ul key={copy} className="sp-marquee-track" aria-hidden={copy === 1 || undefined}>
              {PROOF_TOOLS.map((tool) => <li key={tool.slug}><Link to={`${prefix}/tool/${tool.slug}`} className="sp-proof-logo" tabIndex={copy === 1 ? -1 : undefined}><ToolLogo tool={tool} size={28} /><span>{tool.name}</span></Link></li>)}
            </ul>
          ))}
        </div>
      </div>
    </header>}

    <div className="sp-page-body">
      {!paymentRecovery && <><section className="sp-overview" aria-labelledby="submit-plans-title"><div className="sp-overview-inner">
        <div className="sp-overview-heading"><h2 id="submit-plans-title">{lang === "fr" ? <>Choisis ton chemin. <span className="tt-title-muted">Le verdict reste indépendant.</span></> : <>Pick your path. <span className="tt-title-muted">The verdict stays independent.</span></>}</h2><p>{t("Payer t’achète la rapidité, la certitude et un lien dofollow. Jamais une meilleure note.", "Paying buys speed, certainty and a dofollow link. Never a better score.")}</p></div>
        <div className="sp-plan-grid">
          <article className="sp-plan-card sp-plan-card--free">
            <div className="sp-plan-card-head"><div><span className="sp-plan-price">{t("0 $", "$0")}</span><span className="sp-plan-period">{t("avec un badge", "with a badge")}</span></div><span className="sp-plan-name">{t("Revue standard", "Standard review")}</span></div>
            <ul className="sp-plan-args sp-plan-args--limits">
              <li><Minus size={16} />{t("Lien nofollow", "Nofollow link")}</li>
              <li><Minus size={16} />{t("Publiée seulement si retenue", "Published only if selected")}</li>
              <li><Minus size={16} />{t("Aucun délai garanti", "No set timeline")}</li>
              <li><Minus size={16} />{t("Badge ToolTrim requis sur ton site", "ToolTrim badge required on your site")}</li>
              <li><Minus size={16} />{t("Corrections factuelles après publication", "Fact fixes after publication")}</li>
              <li><Check size={16} />{t("Rédigée par notre équipe, note expliquée", "Written by our editors, score explained")}</li>
            </ul>
            <button type="button" className="sp-plan-free-link" onClick={() => choosePlan("free")}>{t("Rejoindre la revue standard →", "Join the standard review →")}</button>
          </article>
          <article className="sp-plan-card sp-plan-card--highlight">
            <span className="sp-plan-badge">{t("Recommandé", "Recommended")}</span>
            <div className="sp-plan-card-head"><div><span className="sp-plan-price">{price}</span><span className="sp-plan-period">{t("paiement unique", "one-time")}</span></div><span className="sp-plan-name">{t("Fiche prioritaire", "Priority review")}</span></div>
            <ul className="sp-plan-args">
              <li><Link2 size={16} /><strong>{t("Lien dofollow depuis un site DR 43", "Dofollow link from a DR 43 site")}</strong></li>
              <li><Check size={16} />{t("Publication garantie", "Publication guaranteed")}</li>
              <li><Check size={16} />{t("En ligne sous 5 jours ouvrés", "Live within 5 business days")}</li>
              <li><Check size={16} />{t("Rien à installer", "Nothing to install")}</li>
              <li><Check size={16} />{t("Tu vérifies les faits avant publication", "You check the facts before it goes live")}</li>
              <li><Check size={16} />{t("Rédigée par notre équipe, note expliquée", "Written by our editors, score explained")}</li>
            </ul>
            <button type="button" className="tt-button-primary sp-plan-cta" onClick={() => choosePlan("paid")}>{t(`Obtenir ma fiche prioritaire · ${price}`, `Get my priority review · ${price}`)}<ArrowRight size={16} /></button>
          </article>
          <article className="sp-plan-card sp-plan-card--featured">
            <div className="sp-plan-card-head"><div><span className="sp-plan-from">{t("à partir de", "from")}</span><span className="sp-plan-price">{t("99 $", "$99")}</span></div><span className="sp-plan-name">{t("Mise en avant", "Featured")}</span></div>
            <p className="sp-plan-includes">{t("Tout ce qu’inclut la fiche prioritaire, plus :", "Everything in Priority, plus:")}</p>
            <ul className="sp-plan-args">
              <li><Check size={16} /><strong>{t("Mise en avant sur la page d’accueil", "Featured on the homepage")}</strong></li>
              <li><Check size={16} /><strong>{t("Présence dans les stacks pertinents", "Placement in relevant stacks")}</strong></li>
              <li><Check size={16} />{t("Newsletter ou guide, sur demande", "Newsletter or guide mention, on request")}</li>
              <li><Check size={16} />{t("Emplacements signalés comme sponsorisés", "Placements clearly labeled sponsored")}</li>
            </ul>
            <Link className="sp-plan-contact" to={`${prefix}/contact?subject=partnership`}>{t("Parlons-en", "Let’s talk")}<ArrowRight size={16} /></Link>
          </article>
        </div>
        <aside className="sp-rating-proof" id="submit-score" aria-labelledby="submit-score-title">
          <div className="sp-rating-proof-copy">
            <h3 id="submit-score-title" className="sp-score-title">{t("5 critères.", "5 criteria.")}</h3>
            <p>{t("Chacun appuyé sur des faits sourcés. Les acheteurs font confiance à une note qu’ils peuvent vérifier.", "Each backed by sourced facts. Buyers trust a score they can check.")}</p>
            <figure className="sp-score-evidence">
              <figcaption>{t("Pourquoi Puissance obtient 3/5", "Why Performance gets 3/5")}</figcaption>
              <blockquote>{t("« Outil spécialisé couvrant horaires, alertes, itinéraires et trois modes de transport, mais sans navigation détaillée ni plateforme mobile. »", "“A focused utility covering schedules, alerts, routes, and three travel modes, but no turn-by-turn navigation or mobile platform.”")}</blockquote>
              <cite>{t("Sources : commute.bar et conditions, consultées le 7 sept. 2026", "Sources: commute.bar and terms, checked Sept. 7, 2026")}</cite>
            </figure>
          </div>
          <div className="sp-score-card">
            <div className="sp-score-head">
              <ToolLogo tool={{ name: "CommuteBar", slug: "commutebar", websiteUrl: "https://commute.bar/" }} size={44} />
              <div><span>{t("Exemple publié", "Published example")}</span><strong>CommuteBar</strong></div>
              <div className="sp-score-total"><strong>3.8</strong><span>/5 · {t("Très bon", "Great")}</span></div>
            </div>
            <ul className="sp-score-criteria">
              {([["Valeur ajoutée", "Added value", 4], ["Simplicité", "Simplicity", 4], ["Utilisation", "Fit for purpose", 4], ["Puissance", "Performance", 3], ["Réversibilité", "Reversibility", 4]] as const).map(([fr, en, value]) => (
                <li key={en}><span>{t(fr, en)}</span><i style={{ "--sp-score": value / 5 } as React.CSSProperties} aria-hidden="true" /><strong>{value}</strong></li>
              ))}
            </ul>
            <p className="sp-score-verdict">{t("Utile et simple pour les indépendants qui veulent rester concentrés pendant leurs appels. Sa note reste mesurée, car l’outil est spécialisé et réservé au Mac.", "Useful and simple for independent professionals who want to stay focused during calls. Its score stays measured because the product is specialized and Mac-only.")}</p>
            <Link className="sp-score-link" to={`${prefix}/tool/commutebar`} target="_blank" rel="noopener" aria-label={t("Voir la fiche complète de CommuteBar (nouvel onglet)", "See CommuteBar’s full review (opens in a new tab)")}>{t("Voir la fiche complète", "See the full review")}<ArrowUpRight size={15} /></Link>
          </div>
        </aside>
      </div></section>

      <section className="sp-delivery" aria-labelledby="submit-delivery-title">
        <div className="sp-section-intro"><h2 id="submit-delivery-title">{lang === "fr" ? <>En ligne sous 5 jours. <span className="tt-title-muted">Voici comment.</span></> : <>Live in 5 days. <span className="tt-title-muted">Here’s how.</span></>}</h2></div>
        <ol className="sp-timeline">
          <li><span className="sp-timeline-when">{t("Aujourd’hui, quelques minutes", "Today, a few minutes")}</span><p>{t("Indique ton site et ton email, puis paie une fois. Ni badge, ni abonnement.", "Share your site and email, then pay once. No badge, no subscription.")}</p></li>
          <li><span className="sp-timeline-when">{t("Sous 5 jours ouvrés", "Within 5 business days")}</span><p>{t("On étudie ton outil et on rédige la fiche. Tu vérifies les faits avant publication.", "We research your tool and write the review. You check the facts before it goes live.")}</p></li>
          <li><span className="sp-timeline-when">{t("Jour de publication", "Publication day")}</span><p>{t("Ta fiche est en ligne, avec un lien dofollow vers ton site.", "Your review goes live, with a dofollow link to your site.")}</p></li>
        </ol>
        <p className="sp-timeline-policy"><Scale size={16} />{t("Le paiement couvre le travail, jamais le verdict.", "Payment covers the work, never the verdict.")} <Link to={`${prefix}/transparency`}>{t("Lire notre politique éditoriale", "Read our editorial policy")}<ArrowRight size={14} /></Link></p>
      </section>

      </>}
      {plan && <section className="sp-shell" id="submit-form">
        <div className="sp-selected-plan"><span>{t("Ta formule", "Your option")} <strong>{plan === "paid" ? t(`Fiche prioritaire · ${price}`, `Priority review · ${price}`) : t("Revue standard · gratuite", "Standard review · free")}</strong></span><ShieldCheck size={18} /></div>
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
            <div className="sp-section-heading"><span>01</span><div><h2>{t("Commençons par ton outil.", "Let’s start with your tool.")}</h2><p>{inviteName && submission.toolName === inviteName ? t(`${inviteName} est déjà renseigné : il ne manque que ton email.`, `${inviteName} is already filled in: we only need your email.`) : t("Trois informations pour commencer. Tu pourras préciser les détails à la dernière étape.", "Three details to get started. You can add more context in the final step.")}</p></div></div>
            <div className="sp-form-grid"><div className="tt-form-field"><label className="tt-form-label" htmlFor="submit-tool-url">{t("Site officiel", "Official website")}</label><div className="sp-input-wrap"><Globe size={16} /><input className="tt-form-input" id="submit-tool-url" required type="text" inputMode="url" autoComplete="url" spellCheck={false} maxLength={300} value={submission.toolUrl} onChange={(event) => update("toolUrl", event.target.value)} onBlur={() => tidyUrlField("toolUrl")} placeholder={t("exemple.com", "example.com")} /></div></div><div className="tt-form-field"><label className="tt-form-label" htmlFor="submit-tool-name">{t("Nom de l'outil", "Tool name")}</label><div className="sp-input-wrap"><User size={16} /><input className="tt-form-input" id="submit-tool-name" required maxLength={100} value={submission.toolName} onChange={(event) => update("toolName", event.target.value)} placeholder="Acme" /></div></div></div>
            <div className="tt-form-field"><label className="tt-form-label" htmlFor="submit-email">Email</label><div className="sp-input-wrap"><Mail size={16} /><input className="tt-form-input" id="submit-email" required type="email" autoComplete="email" maxLength={200} value={submission.email} onChange={(event) => update("email", event.target.value)} placeholder="you@example.com" /></div></div>
            {error && <p className="tt-form-error" role="alert">{error}</p>}
            <div className="sp-actions sp-actions--split"><button type="button" className="sp-button-secondary" onClick={() => setPlan(null)}>{t("← Revoir les offres", "← Review options")}</button><button type="submit" className="tt-button-primary" disabled={status === "saving"}>{status === "saving" ? t("Enregistrement…", "Saving…") : plan === "paid" ? t("Continuer vers le paiement →", "Continue to payment →") : t("Continuer vers le badge →", "Continue to the badge →")}</button></div>
          </form>}

          {step === 2 && plan === "paid" && <section className="sp-form">
            <div className="sp-section-heading"><span>02</span><div><h2>{t("Confirmer ta fiche prioritaire", "Confirm your priority review")}</h2><p>{t("Ton outil passe directement à la rédaction, sans installation sur ton site.", "Your tool goes directly to the editorial team, with nothing to install on your site.")}</p></div></div>
            <div className="sp-payment-summary"><div><span>{t("FICHE PRIORITAIRE", "PRIORITY REVIEW")}</span><strong>{submission.toolName}</strong><small>{submission.toolUrl}</small></div><strong>{price}</strong></div>
            <ul className="sp-payment-recap"><li><Link2 size={16} /><strong>{t("Lien dofollow depuis un site DR 43", "Dofollow link from a DR 43 site")}</strong></li><li><Check size={16} />{t("En ligne sous 5 jours ouvrés, garanti", "Live within 5 business days, guaranteed")}</li><li><Check size={16} />{t("Tu vérifies les faits avant publication", "You check the facts before it goes live")}</li></ul>
                        <a href={checkoutUrl.href} data-creem-checkout data-creem-url={checkoutUrl.href} className="tt-button-primary sp-payment-cta" onClick={beginCheckout}><CreditCard size={17} />{t(`Payer ${price} et lancer ma fiche`, `Pay ${price} and start my review`)}</a>
            {error && <p className="tt-form-error" role="alert">{error}</p>}
            <p className="sp-payment-meta">{t("Paiement unique sécurisé par Creem. Aucun abonnement.", "Secure one-time payment via Creem. No subscription.")}</p>
            <div className="sp-actions"><button type="button" className="sp-button-secondary" onClick={() => setStep(1)}>{t("← Modifier les informations", "← Edit information")}</button></div>
          </section>}

          {step === 2 && plan === "free" && <section className="sp-form">
            <div className="sp-section-heading"><span>02</span><div><h2>{t("Installer le badge ToolTrim", "Install the ToolTrim badge")}</h2><p>{t("Il débloque la revue standard sans influencer notre décision.", "It unlocks the standard review without influencing our decision.")}</p></div></div>
            <aside className="sp-upgrade-note" aria-labelledby="submit-upgrade-title">
              <p className="sp-upgrade-kicker">{t("La revue gratuite demande une modification de ton site.", "The free review needs a change on your site.")}</p>
              <div className="sp-upgrade-compare">
                <div><span>{t("Gratuit", "Free")}</span><ul><li><Minus size={14} />{t("Lien nofollow", "Nofollow link")}</li><li><Minus size={14} />{t("Aucun délai garanti", "No set timeline")}</li><li><Minus size={14} />{t("Publiée seulement si retenue", "Published only if selected")}</li></ul></div>
                <div><span id="submit-upgrade-title">{t(`Fiche prioritaire · ${price}`, `Priority review · ${price}`)}</span><ul><li><Link2 size={14} /><strong>{t("Lien dofollow depuis un site DR 43", "Dofollow link from a DR 43 site")}</strong></li><li><Check size={14} />{t("En ligne sous 5 jours ouvrés", "Live within 5 business days")}</li><li><Check size={14} />{t("Rien à installer", "Nothing to install")}</li></ul></div>
              </div>
              <button type="button" className="sp-upgrade-cta" onClick={upgradeToPaid}>{t(`Passer à la fiche prioritaire · ${price}`, `Switch to the priority review · ${price}`)}<ArrowRight size={15} /></button>
            </aside>
            <ol className="sp-badge-steps">
              <li>
                <span className="sp-badge-step-title">{t("Choisis le style du badge", "Pick the badge style")}</span>
                <div className="sp-badge-themes" role="group" aria-label={t("Version du badge", "Badge version")}><button type="button" className={badgeTheme === "light" ? "sp-badge-theme--active" : ""} onClick={() => setBadgeTheme("light")}>{t("Clair", "Light")}</button><button type="button" className={badgeTheme === "dark" ? "sp-badge-theme--active" : ""} onClick={() => setBadgeTheme("dark")}>{t("Sombre", "Dark")}</button></div>
                <div className={`sp-badge-preview sp-badge-preview--${badgeTheme}`}><img src={`/${badgeAsset}`} alt={badgeAlt} width={216} height={54} /></div>
              </li>
              <li>
                <span className="sp-badge-step-title">{t("Colle ce code sur ton site", "Paste this code on your site")}</span>
                <div className="sp-code-wrap"><code className="sp-code">{badgeHtml}</code><button type="button" className="sp-copy-button" onClick={copyBadge} aria-label={t("Copier le code du badge", "Copy badge code")}>{codeCopied ? <Check size={17} /> : <Copy size={17} />}</button></div>
                <label className="sp-installed-check"><input type="checkbox" checked={badgeInstalled} onChange={(event) => setBadgeInstalled(event.target.checked)} />{t("J'ai ajouté le badge sur mon site", "I've added the badge to my website")}</label>
              </li>
              <li>
                <div className="tt-form-field"><label className="tt-form-label sp-badge-step-title" htmlFor="submit-badge-url">{t("URL de la page avec le badge", "URL of the page with the badge")}</label><input ref={badgeUrlRef} className="tt-form-input" id="submit-badge-url" type="text" inputMode="url" autoComplete="url" spellCheck={false} maxLength={300} value={submission.badgeUrl} onChange={(event) => update("badgeUrl", event.target.value)} onBlur={() => tidyUrlField("badgeUrl")} placeholder={`${t("ex.", "e.g.")} ${submission.toolUrl.replace(/\/$/, "") || "https://example.com"}/partners`} aria-invalid={Boolean(error) || undefined} aria-describedby={error ? "submit-badge-error" : undefined} /></div>
                {error && <p className="tt-form-error" id="submit-badge-error" role="alert">{error}</p>}
              </li>
            </ol>
            <div className="sp-actions sp-actions--split"><button type="button" className="sp-button-secondary" onClick={() => setStep(1)}>{t("← Modifier", "← Edit")}</button><button type="button" className="tt-button-primary" disabled={!badgeInstalled || status === "checking"} onClick={verifyBadge}>{status === "checking" ? t("Validation…", "Validating…") : t("Valider et continuer →", "Validate and continue →")}</button></div>
          </section>}

          {step === 3 && <form className="sp-form" onSubmit={submit}>
            <div className="sp-section-heading"><span>03</span><div><h2>{t("Aide-nous à évaluer le produit", "Help us evaluate the product")}</h2><p>{t("Donne le contexte nécessaire à la revue éditoriale.", "Give us the context needed for the editorial review.")}</p></div></div>
            <div className="sp-verified"><Check size={16} />{paid ? t("Paiement confirmé : fiche prioritaire", "Payment confirmed: priority review") : t("Badge vérifié : revue standard", "Badge verified: standard review")}</div>
            <div className="tt-form-field"><label className="tt-form-label" htmlFor="submit-role">{t("Ton lien avec l'outil", "Your relationship to the tool")}</label><select className="tt-form-input" id="submit-role" required value={submission.submitterRole} onChange={(event) => update("submitterRole", event.target.value)}><option value="" disabled>{t("Sélectionner…", "Select…")}</option><option value="founder">{t("Fondateur·rice / équipe", "Founder / team")}</option><option value="user">{t("Utilisateur·rice", "User")}</option><option value="agency">{t("Agence / partenaire", "Agency / partner")}</option><option value="other">{t("Autre", "Other")}</option></select></div>
            <div className="tt-form-field"><label className="tt-form-label" htmlFor="submit-name">{t("Ton nom", "Your name")}</label><input className="tt-form-input" id="submit-name" required autoComplete="name" maxLength={100} value={submission.name} onChange={(event) => update("name", event.target.value)} /></div>
            <div className="tt-form-field"><label className="tt-form-label" htmlFor="submit-description">{t("Ce que nous devons comprendre", "What we should understand")}</label><textarea className="tt-form-input tt-form-textarea" id="submit-description" required maxLength={2000} rows={6} value={submission.message} onChange={(event) => update("message", event.target.value)} placeholder={t("À qui s'adresse l'outil, quel problème résout-il et qu'est-ce qui le distingue ?", "Who is the tool for, what problem does it solve, and what makes it different?")} /></div>
            <p className="sp-publication-note">{paid ? t("La publication est prioritaire. ToolTrim conserve le dernier mot sur le verdict et le contenu éditorial.", "Publication is prioritized. ToolTrim retains final say over the verdict and editorial content.") : t("ToolTrim choisit librement de publier et conserve le dernier mot sur le verdict. Les erreurs factuelles peuvent être corrigées.", "ToolTrim independently decides whether to publish and retains final say over the verdict. Factual errors can be corrected.")}</p>
            {error && <p className="tt-form-error" role="alert">{error}</p>}<div className="sp-actions"><button type="submit" className="tt-button-primary" disabled={status === "submitting"}>{status === "submitting" ? t("Envoi…", "Submitting…") : t("Envoyer pour revue →", "Submit for review →")}</button></div>
          </form>}
        </div>
      </section>}

      {!paymentRecovery && <><section className="sp-faq-section" aria-labelledby="submit-faq-title">
        <div className="sp-section-intro"><h2 id="submit-faq-title">{t("Vos questions, nos réponses.", "Questions, answered.")}</h2></div>
        <div className="sp-faq-list">
          <details><summary>{t("Payer peut-il améliorer ma note ?", "Can paying improve my score?")}</summary><p>{t("Non. La note, le verdict, les alternatives et le classement ne dépendent jamais du paiement. C’est ce qui donne de la valeur à une bonne note.", "No. The score, verdict, alternatives and ranking never depend on payment. That’s what makes a good score worth something.")}</p></details>
          <details><summary>{t("Et si ma note est basse ?", "What if my score is low?")}</summary><p>{t("Nous publions un verdict que nous pouvons étayer par des faits, points forts compris. Tu vérifies les faits avant publication, et tu peux demander une mise à jour quand ton produit évolue.", "We publish a verdict we can back with facts, strengths included. You check the facts before it goes live, and you can ask for an update when your product changes.")}</p></details>
          <details><summary>{t("Le lien est-il dofollow et permanent ?", "Is the link dofollow and permanent?")}</summary><p>{t(`Avec la fiche à ${price}, ton site officiel reçoit un lien dofollow ; les soumissions gratuites sont en nofollow. Le lien reste tant que la fiche est publiée et que l’URL demeure valide. ToolTrim peut mettre à jour ou retirer une fiche devenue obsolète ou non conforme.`, `With the ${price} review, your official site gets a dofollow link; free submissions are nofollow. It stays as long as the review is published and the URL is valid. ToolTrim may update or remove an outdated or non-compliant review.`)}</p></details>
          <details><summary>{t("Que vais-je recevoir exactement ?", "What exactly will I receive?")}</summary><p>{t("Une fiche complète rédigée par notre équipe : présentation, usages, tarifs, alternatives, note expliquée, verdict et lien vers ton site. Publiée en français et en anglais.", "A full review written by our editors: overview, use cases, pricing, alternatives, an explained score, our verdict and a link to your site. Published in French and English.")}</p></details>
          <details><summary>{t("Et si le délai de 5 jours est dépassé ?", "What if the 5-day deadline is missed?")}</summary><p>{t("Nous te contactons directement et finalisons ta fiche en priorité. Les conditions de remboursement sont celles présentées par Creem au moment du paiement.", "We contact you directly and prioritise finishing your review. Refund terms are those shown by Creem at checkout.")}</p></details>
          <details><summary>{t("Puis-je mettre ma fiche à jour plus tard ?", "Can I update my review later?")}</summary><p>{t("Oui. Écris à contact@tooltrim.com avec ce qui a changé. Nous vérifions les mises à jour factuelles avant de les appliquer.", "Yes. Email contact@tooltrim.com with what changed. We verify factual updates before applying them.")}</p></details>
        </div>
      </section>
      <section className="sp-closing" aria-labelledby="submit-closing-title">
        <div><h2 id="submit-closing-title">{lang === "fr" ? <>{inviteName || "Ton outil"} peut être en ligne la semaine prochaine. <span className="tt-title-muted">Une note méritée, un lien dofollow, rien à écrire.</span></> : <>{inviteName || "Your tool"} could be live next week. <span className="tt-title-muted">Earned score, dofollow link, nothing to write.</span></>}</h2><p>{t(`${price}, une fois. Ni badge, ni abonnement.`, `${price}, once. No badge, no subscription.`)}</p></div>
        <button type="button" className="tt-button-primary" onClick={() => choosePlan("paid", "closing")}>{inviteName ? t(`Faire évaluer ${inviteName} · ${price}`, `Get ${inviteName} reviewed · ${price}`) : t(`Faire évaluer mon outil · ${price}`, `Get my tool reviewed · ${price}`)}<ArrowRight size={16} /></button>
      </section>
      <p className="sp-contact-line">{inviteName ? t("Une question ? Réponds simplement à mon email.", "Questions? Just reply to my email.") : <>{t("Une question ou un projet de partenariat ?", "A question or partnership in mind?")} <Link className="sp-text-link" to={`${prefix}/contact?subject=partnership`}>{t("Parlons-en", "Let’s talk")}<ArrowRight size={15} /></Link></>}</p>
      </>}
    </div>
  </div>;
};

export default SubmitToolPage;
