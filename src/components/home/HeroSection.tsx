import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { ArrowRight } from "@/lib/icons";
import { useState } from "react";

/* ─────────────────────────────────────────────────────────────────────────────
   HeroSection — Sprint Identité
   Hero en 2 zones : message à gauche + Stack Audit Preview à droite.
   Le module Preview donne immédiatement une identité produit à ToolTrim.
───────────────────────────────────────────────────────────────────────────── */

/* ── Logo with favicon CDN + letter fallback ── */
interface AuditToolLogoProps {
  name: string;
  domain: string;
}

function AuditToolLogo({ name, domain }: AuditToolLogoProps) {
  const [imgError, setImgError] = useState(false);
  const faviconUrl = `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=32`;

  return (
    <span className="hp-audit-logo">
      {!imgError ? (
        <img
          src={faviconUrl}
          alt=""
          aria-hidden="true"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="hp-audit-logo-letter">{name[0].toUpperCase()}</span>
      )}
    </span>
  );
}

/* ── Badge component ── */
type BadgeVariant = "keep" | "challenge" | "duplicate" | "soon";

const BADGE_LABELS: Record<BadgeVariant, { fr: string; en: string }> = {
  keep:      { fr: "À garder",    en: "Keep"       },
  challenge: { fr: "À challenger", en: "Challenge"  },
  duplicate: { fr: "Doublon",     en: "Duplicate"  },
  soon:      { fr: "Trop tôt",    en: "Too soon"   },
};

interface AuditBadgeProps {
  variant: BadgeVariant;
  lang: string;
}

function AuditBadge({ variant, lang }: AuditBadgeProps) {
  const label = lang === "fr" ? BADGE_LABELS[variant].fr : BADGE_LABELS[variant].en;
  return (
    <span className={`hp-audit-badge hp-audit-badge--${variant}`}>{label}</span>
  );
}

/* ── Stack Audit Preview ── */
const AUDIT_TOOLS = [
  {
    name: "Notion",
    domain: "notion.so",
    variant: "keep" as BadgeVariant,
    price: "8 €",
    whyFr: "Ton hub central. Rôle clair : notes + docs.",
    whyEn: "Your central hub. Clear role: notes + docs.",
  },
  {
    name: "Canva",
    domain: "canva.com",
    variant: "keep" as BadgeVariant,
    price: "15 €",
    whyFr: "Visuels clients et réseaux. Indispensable si tu publies.",
    whyEn: "Client visuals and social. Essential if you publish.",
  },
  {
    name: "Loom",
    domain: "loom.com",
    variant: "challenge" as BadgeVariant,
    price: "8 €",
    whyFr: "Utilisé 2× ce mois. Slack video suffit peut-être.",
    whyEn: "Used 2× this month. Slack video might suffice.",
  },
  {
    name: "Trello",
    domain: "trello.com",
    variant: "duplicate" as BadgeVariant,
    price: "5 €",
    whyFr: "Doublon avec Notion. Tes boards sont vides depuis 6 semaines.",
    whyEn: "Duplicate of Notion. Your boards have been empty for 6 weeks.",
  },
  {
    name: "Zapier",
    domain: "zapier.com",
    variant: "soon" as BadgeVariant,
    price: "49 €",
    whyFr: "Payé 49€ pour 1 zap actif. Make coûte 9€ pour le même usage.",
    whyEn: "Paying 49€ for 1 active zap. Make does the same for 9€.",
  },
];

function StackAuditPreview({ lang, prefix }: { lang: string; prefix: string }) {
  const isFr = lang === "fr";

  return (
    <div className="hp-audit">
      {/* Header */}
      <div className="hp-audit-header">
        <span className="hp-audit-header-label">
          {isFr ? "Audit de stack" : "Stack audit"}
        </span>
        <span className="hp-audit-header-budget">
          {isFr ? "Budget actuel · 85 €/mois" : "Current budget · €85/mo"}
        </span>
      </div>

      {/* Tool rows */}
      {AUDIT_TOOLS.map((tool) => (
        <div key={tool.name} className="hp-audit-row">
          <AuditToolLogo name={tool.name} domain={tool.domain} />
          <span className="hp-audit-tool-name">{tool.name}</span>
          <AuditBadge variant={tool.variant} lang={lang} />
          <span className="hp-audit-price">{tool.price}</span>
          {/* Hover reveal */}
          <span className="hp-audit-why" aria-hidden="true">
            {isFr ? tool.whyFr : tool.whyEn}
          </span>
        </div>
      ))}

      {/* Footer — budget */}
      <div className="hp-audit-footer">
        <div className="hp-audit-footer-budget">
          <span className="hp-audit-footer-label">
            {isFr ? "Budget cible" : "Target budget"}
          </span>
          <span className="hp-audit-footer-amount">
            {isFr ? "48 €/mois" : "€48/mo"}
          </span>
        </div>
        <span className="hp-audit-footer-saving">
          {isFr ? "−37 €/mois" : "−€37/mo"}
        </span>
      </div>

      <div className="hp-audit-bottom">
        {/* Mini CTA */}
        <Link to={`${prefix}/selector`} className="hp-audit-mini-cta">
          {isFr ? "Auditer ma vraie stack" : "Audit my real stack"}
          <ArrowRight style={{ width: 13, height: 13 }} />
        </Link>

        {/* Disclaimer */}
        <p className="hp-audit-disclaimer">
          {isFr
            ? "Exemple basé sur un profil freelance type."
            : "Example based on a typical freelance profile."}
        </p>
      </div>
    </div>
  );
}

/* ── Main hero component ── */
const HeroSection = () => {
  const { lang, t, prefix } = useLang();

  return (
    <section className="eh-root" style={{ display: "flex", alignItems: "center" }}>
      <div
        className="eh-container w-full"
        style={{ maxWidth: "var(--layout-content, 1280px)", margin: "0 auto", padding: "0 var(--layout-gutter, 48px)" }}
      >
        <div className="hp-hero-2col">

          {/* ── Left: message ── */}
          <div className="hp-hero-left">
            <span className="eh-eyebrow" style={{ marginBottom: 28 }}>
              {t("pour les freelances et solopreneurs", "for freelancers and solopreneurs")}
            </span>

            <h1 className="eh-title" style={{ textAlign: "left" }}>
              {lang === "fr"
                ? <>Tu paies des outils<br />que tu n’utilises plus.<br />Il est temps<br />de le savoir.</>
                : <>You pay for tools<br />you no longer use.<br />It’s time<br />to know.</>}
            </h1>

            <p className="eh-description" style={{ maxWidth: 480, textAlign: "left", marginTop: 24 }}>
              {t(
                "ToolTrim analyse ta stack, repère les doublons et les abonnements inutiles, et te dit exactement quoi garder — selon ton profil, ton budget et ton usage réel.",
                "ToolTrim analyzes your stack, spots duplicates and useless subscriptions, and tells you exactly what to keep — based on your profile, budget and real usage.",
              )}
            </p>

            <div className="eh-cta-group" style={{ justifyContent: "flex-start", marginTop: 36 }}>
              <Link to={`${prefix}/selector`} className="eh-cta-primary">
                {t("Auditer ma stack", "Audit my stack")}
                <ArrowRight style={{ width: 15, height: 15 }} />
              </Link>
              <Link to={`${prefix}/stacks`} className="eh-cta-secondary">
                {t("Explorer les stacks types", "Browse stack templates")}
              </Link>
            </div>
          </div>

          {/* ── Right: audit preview ── */}
          <div className="hp-hero-right">
            <StackAuditPreview lang={lang} prefix={prefix} />
          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
