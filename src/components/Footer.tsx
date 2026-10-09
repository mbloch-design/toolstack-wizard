import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Link } from "@/lib/routerLinks";
import { ArrowRight, ChevronRight } from "@/lib/icons";
import ToolLogo from "@/components/ToolLogo";
import { useLang } from "@/hooks/useLang";
import { openConsentBanner } from "@/components/AnalyticsConsent";
import { getLanguageSwitchPath } from "@/lib/seo";
import { formatAmount } from "@/lib/currencyRates";
import { readStackSnapshot, type StackSnapshot } from "@/lib/stackSnapshot";
import FooterTrim from "@/components/FooterTrim";

/**
 * Directory badges, kept in the prerendered HTML: directories check that
 * their badge and link are on the page. One image each (8 Oct 2026): the
 * footer is always light, so the dark variants never showed, and they
 * doubled the badges' weight on 13,000+ pages. `rel` is kept per badge as
 * agreed with each directory.
 */
type Badge = { href: string; rel: string; label: string; src: string; alt: string; width: number; height: number; title?: string; fallback?: string };
const BADGES: Badge[] = [
  { href: "https://dang.ai", rel: "dofollow noopener", label: "Verified on DANG!", src: "https://assets.dang.ai/badges/dang-verified-dark.png", alt: "Verified on DANG!", width: 260, height: 94 },
  { href: "https://neeed.directory", rel: "noopener", label: "Featured on neeed.directory", src: "https://neeed.directory/badges/neeed-badge-light.svg", alt: "Featured on neeed.directory", width: 139, height: 44 },
  { href: "https://nicklaunches.com/products/tooltrim/?utm_source=tooltrim.com&utm_medium=badge&utm_campaign=featured", rel: "noopener", label: "ToolTrim on Nick Launches", src: "https://nicklaunches.com/badges/featured.png", alt: "ToolTrim on Nick Launches", width: 244, height: 56 },
  { href: "https://backlinklog.com/listing/tooltrim.com?utm_source=backlinklog&utm_medium=badge", rel: "noopener", label: "Listed on BacklinkLog", src: "https://backlinklog.com/badge/tooltrim.com.svg", alt: "Listed on BacklinkLog", width: 160, height: 40 },
  { href: "https://launchnest.io/p/tooltrim", rel: "noopener", label: "Tooltrim on LaunchNest", src: "https://launchnest.io/badge/tooltrim.svg?variant=listed&theme=light", alt: "Tooltrim on LaunchNest", width: 220, height: 56 },
  { href: "https://vibecodinglist.com/projects/tooltrim?utm_source=vcl_badge&utm_medium=builder_site&utm_campaign=listed_badge&utm_content=tooltrim", rel: "noopener", label: "Featured on VibeCodingList", src: "https://vibecodinglist.com/assets/embed-widget/featured-on-badge-dark.png", alt: "Featured on VibeCodingList", width: 200, height: 51 },
  { href: "https://dailypings.com/p/tooltrim", rel: "noopener", label: "Featured on DailyPings", src: "https://dailypings.com/badge.svg", alt: "Featured on DailyPings", width: 179, height: 32 },
  { href: "https://postyourstartup.co/startup/tooltrim-1?ref=badge", rel: "noopener", label: "Featured on PostYourStartup", src: "https://postyourstartup.co/api/badge/tooltrim-1?theme=light", alt: "Featured on PostYourStartup", width: 212, height: 55 },
  { href: "https://turbo0.com/item/tooltrim", rel: "noopener noreferrer", label: "Listed on Turbo0", src: "https://img.turbo0.com/badge-listed-light.svg", alt: "Listed on Turbo0", width: 164, height: 54 },
  { href: "https://goodaitools.com/ai/tooltrim", rel: "noopener noreferrer", label: "ToolTrim on Good AI Tools", src: "https://goodaitools.com/assets/images/badge.png", alt: "Good AI Tools", width: 207, height: 54 },
  { href: "https://aiagentsdirectory.com/agent/tooltrim", rel: "noopener", label: "ToolTrim on AI Agents Directory", src: "https://aiagentsdirectory.com/featured-badge.svg?v=2024", alt: "ToolTrim - Featured on AI Agents Directory", width: 200, height: 50, title: "Discover ToolTrim on AI Agents Directory" },
  { href: "https://linksalad.me/projects/tooltrim?utm_source=badge", rel: "noopener noreferrer", label: "ToolTrim on LinkSalad", src: "https://linksalad.me/images/badges/featured-on-light.svg", alt: "Featured on LinkSalad", width: 150, height: 44 },
  { href: "https://peerpush.com/p/tooltrim", rel: "noopener", label: "ToolTrim on PeerPush", src: "https://peerpush.com/p/tooltrim/badge.png", alt: "ToolTrim on PeerPush", width: 230, height: 65 },
  { href: "https://startupfa.me/s/tooltrim?utm_source=tooltrim.com", rel: "noopener", label: "ToolTrim - Featured on Startup Fame", src: "https://startupfa.me/badges/featured-badge.webp", alt: "ToolTrim - Featured on Startup Fame", width: 171, height: 54, fallback: "Startup Fame" },
  { href: "https://shipthing.com/projects/tooltrim-6645?utm_source=badge", rel: "noopener noreferrer", label: "Featured on ShipThing", src: "https://shipthing.com/shipthing/images/badges/featured-on-light.svg", alt: "Featured on ShipThing", width: 150, height: 44 },
  { href: "https://findly.tools/tooltrim?utm_source=tooltrim", rel: "noopener noreferrer", label: "Featured on Findly.tools", src: "https://findly.tools/badges/findly-tools-badge-light.svg", alt: "Featured on Findly.tools", width: 175, height: 55 },
  { href: "https://sellwithboost.com", rel: "noopener noreferrer", label: "Listed on Sell With boost", src: "https://sellwithboost.com/badge/listing.svg", alt: "Listed on Sell With boost", width: 160, height: 40 },
  { href: "https://twelve.tools", rel: "noopener noreferrer", label: "Featured on Twelve Tools", src: "https://twelve.tools/badge0-white.svg", alt: "Featured on Twelve Tools", width: 148, height: 40 },
];

/**
 * Editorial footer on one 12-column grid (8 Oct 2026):
 *   1. Promise and proof (left half) | the visitor's stack, or the invitation
 *      to build one (right half, aligned on the third link column)
 *   2. Four link columns of three grid columns each
 *   3. Legal rail: legal links left, cookies and language right
 *   4. Directory badges in uniform cells, the label taking the first cell
 *
 * The twist is the right half: whoever has a stack meets its figures again at
 * the end of every page (tools, monthly cost, paid twice), read from the
 * snapshot Ma stack writes. Rendered after mount only, so the prerendered
 * HTML stays the same for everyone.
 */
const Footer = () => {
  const { t, prefix, lang } = useLang();
  const year = new Date().getFullYear();
  const location = useLocation();
  // On Ma stack itself, the stack card would repeat the page being read.
  const onMyStack = /\/(ma-stack|my-stack)(\/|$)/.test(location.pathname);
  const [snapshot, setSnapshot] = useState<StackSnapshot | null>(null);
  useEffect(() => { setSnapshot(readStackSnapshot()); }, [location.pathname]);
  // The paid-twice gauge fills when the card is seen, not when it mounts.
  const stackCardRef = useRef<HTMLAnchorElement>(null);
  const [cardSeen, setCardSeen] = useState(false);
  useEffect(() => {
    const node = stackCardRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setCardSeen(true); observer.disconnect(); } }, { threshold: 0.5 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [snapshot]);
  const tagline = t("Choisir, pas empiler.", "Choose, don't stack.");
  const languagePath = (target: "fr" | "en") => `${getLanguageSwitchPath(location.pathname, target)}${location.search}`;
  const money = (amount: number) => snapshot ? formatAmount(amount, snapshot.currency, lang) : "";

  return (
    <footer className="tt-footer" role="contentinfo">
      <div className="tt-footer-container">

        {/* 1. Promise and the visitor's stack */}
        <section className="tt-footer-top">
          <div className="tt-footer-promise">
            {/* The pile follows the last word, even when the line wraps. */}
            <p className="tt-footer-tagline">{tagline.slice(0, tagline.lastIndexOf(" ") + 1)}<span className="tt-footer-tagline-end">{tagline.slice(tagline.lastIndexOf(" ") + 1)}<FooterTrim /></span></p>
            <p className="tt-footer-intro">
              {t(
                "ToolTrim aide les freelances à choisir, comparer et rationaliser leurs outils SaaS, sans empiler les abonnements.",
                "ToolTrim helps freelancers choose, compare and streamline their SaaS tools without piling up subscriptions.",
              )}
            </p>
          </div>

          {snapshot && !onMyStack ? (
            <Link ref={stackCardRef} className="tt-footer-stack" data-seen={cardSeen ? "" : undefined} to={`${prefix}/ma-stack`}>
              <span className="tt-footer-stack-head">
                {snapshot.top && snapshot.top.length > 0 && <span className="tt-footer-stack-logos" aria-hidden="true">
                  {snapshot.top.map((tool) => <ToolLogo key={tool.slug} tool={{ id: tool.slug, slug: tool.slug, name: tool.name, logo: tool.logo }} size={28} allowRemoteSources={false} />)}
                </span>}
                <span>{t("Ma stack", "My stack")} · {snapshot.tools} {t(snapshot.tools > 1 ? "outils" : "outil", snapshot.tools > 1 ? "tools" : "tool")}</span>
              </span>
              <span className="tt-footer-stack-total"><span className="tt-footer-stack-approx">≈</span>{money(snapshot.monthly)}<small>{t("/mois", "/mo")}</small></span>
              {snapshot.double > 0 && snapshot.monthly > 0 ? <>
                {/* The share paid twice, as a hairline gauge. */}
                <span className="tt-footer-stack-gauge" aria-hidden="true"><span style={{ width: `${Math.max(3, Math.min(100, Math.round(snapshot.double / snapshot.monthly * 100)))}%` }} /></span>
                <span className="tt-footer-stack-note">{t(`dont ${money(snapshot.double)} payés en double`, `of which ${money(snapshot.double)} paid twice`)}</span>
              </> : <span className="tt-footer-stack-note">{t("Aucun recoupement en cours", "No overlap left")}</span>}
              <span className="tt-footer-stack-cta">
                {snapshot.double > 0 ? t("Trancher les doublons", "Settle the overlaps") : t("Reprendre ma stack", "Back to my stack")}
                <ChevronRight aria-hidden="true" />
              </span>
            </Link>
          ) : (
            <div className="tt-footer-actions" aria-label={t("Continuer avec ToolTrim", "Continue with ToolTrim")}>
              {!onMyStack && <Link className="tt-footer-action tt-footer-action--primary" to={`${prefix}/ma-stack`}>
                <span>{t("Construire ma stack", "Build my stack")}</span>
                <ArrowRight aria-hidden="true" />
              </Link>}
              <Link className="tt-footer-action tt-footer-action--secondary" to={`${prefix}/tools`}>
                <span>{t("Explorer les outils", "Explore tools")}</span>
                <ArrowRight aria-hidden="true" />
              </Link>
            </div>
          )}
        </section>

        {/* 2. Links: four columns on the same grid */}
        <section className="tt-footer-nav">
          {/* Four links per column, so no column trails a gap. */}
          <nav aria-label={t("Décider", "Decide")} className="tt-footer-col">
            <span className="tt-footer-col-label">{t("Décider", "Decide")}</span>
            <Link to={`${prefix}/comparatifs`}>{t("Comparatifs", "Comparisons")}</Link>
            <Link to={`${prefix}/guides`}>{t("Guides", "Guides")}</Link>
            <Link to={`${prefix}/stacks`}>{t("Stacks", "Stacks")}</Link>
            <Link to={`${prefix}/ma-stack`}>{t("Ma stack", "My stack")}</Link>
          </nav>
          <nav aria-label={t("Explorer", "Explore")} className="tt-footer-col">
            <span className="tt-footer-col-label">{t("Explorer", "Explore")}</span>
            <Link to={`${prefix}/tools`}>{t("Catalogue des outils", "Tool catalog")}</Link>
            <Link to={`${prefix}/explorer`}>{t("Associer des outils", "Pair tools")}</Link>
            <Link to={`${prefix}/search`}>{t("Rechercher un outil", "Search a tool")}</Link>
            <Link to={`${prefix}/category`}>{t("Toutes les catégories", "All categories")}</Link>
          </nav>
          {/* The categories closest to a freelancer's budget, all indexable. */}
          <nav aria-label={t("Catégories", "Categories")} className="tt-footer-col">
            <span className="tt-footer-col-label">{t("Catégories", "Categories")}</span>
            <Link to={`${prefix}/category/ia-generaliste`}>{t("IA généraliste", "AI tools")}</Link>
            <Link to={`${prefix}/category/finance-facturation`}>{t("Finance et facturation", "Finance and invoicing")}</Link>
            <Link to={`${prefix}/category/gestion-projet`}>{t("Gestion de projet", "Project management")}</Link>
            <Link to={`${prefix}/category/automatisation`}>{t("Automatisation", "Automation")}</Link>
          </nav>
          <nav aria-label="ToolTrim" className="tt-footer-col">
            <span className="tt-footer-col-label">ToolTrim</span>
            <Link to={`${prefix}/about`}>{t("À propos", "About")}</Link>
            <Link to={`${prefix}/transparency`}>{t("Méthodologie et transparence", "Methodology and transparency")}</Link>
            <Link to={`${prefix}/contact`}>{t("Contact", "Contact")}</Link>
            <Link to={`${prefix}/submit`}>{t("Soumettre un outil", "Submit a tool")}</Link>
          </nav>
        </section>

        {/* 3. Legal rail */}
        <section className="tt-footer-rail">
          <div className="tt-footer-legal">
            <span>{t(`Copyright © ${year} ToolTrim. Tous droits réservés.`, `Copyright © ${year} ToolTrim. All rights reserved.`)}</span>
            <Link to={`${prefix}/legal-notice`}>{t("Mentions légales", "Legal notice")}</Link>
            <Link to={`${prefix}/privacy-policy`}>{t("Confidentialité", "Privacy")}</Link>
            <Link to={`${prefix}/terms`}>{t("CGV", "Terms")}</Link>
            <button type="button" className="tt-footer-linkbutton" onClick={openConsentBanner}>{t("Gérer les cookies", "Manage cookies")}</button>
          </div>
          {/* Language: a two-option switch, the current one filled, so it
              reads as a choice and not as one more link. */}
          <nav className="tt-footer-lang" aria-label={t("Langue", "Language")}>
            {(["fr", "en"] as const).map((code) => code === lang
              ? <span key={code} aria-current="true" lang={code} title={code === "fr" ? "Français" : "English"}>{code.toUpperCase()}</span>
              : <Link key={code} to={languagePath(code)} hrefLang={code} lang={code} title={code === "fr" ? "Lire en français" : "Read in English"} aria-label={code === "fr" ? "Français" : "English"}>{code.toUpperCase()}</Link>)}
          </nav>
        </section>

        {/* 4. Directory badges stay visible (Michael, 8 Oct 2026): uniform
            cells, grey until hovered, the label in the first cell. */}
        <section className="tt-footer-partners" aria-label={t("Repéré sur", "Featured on")}>
          <span className="tt-footer-partners-label">{t("Repéré sur", "Featured on")}</span>
            <div className="tt-footer-badges">
              {BADGES.map((badge) => (
                <a key={badge.href} href={badge.href} target="_blank" rel={badge.rel} title={badge.title} className="tt-footer-badge" aria-label={badge.label}>
                  <img src={badge.src} alt={badge.alt} width={badge.width} height={badge.height} loading="lazy"
                    onError={badge.fallback ? (event) => { event.currentTarget.style.display = "none"; event.currentTarget.parentElement?.setAttribute("data-fallback", badge.fallback as string); } : undefined} />
                </a>
              ))}
              {/* FranceSaaS.fr requires their badge embedded verbatim (same
                  markup/attributes, no nofollow/display:none/visibility:hidden)
                  for their automated backlink check, so the DOM below is kept
                  byte-for-byte as supplied. It's sized down to the row's 22px
                  height the same way every other badge already is — via an
                  external CSS override (.tt-footer-badge--francesaas), never
                  by editing the markup or its inline style. */}
              <a href="https://francesaas.fr/saas/tooltrim" target="_blank" rel="noopener" title="Profil du SaaS Tooltrim sur FranceSaaS.fr" className="tt-footer-badge tt-footer-badge--francesaas" style={{ display: "inline-block", width: "200px" }}>
          <svg id="a" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 54">
            <rect x="1.3" y="1.3" width="167.4" height="51.4" rx="13" ry="13" fill="#fff" stroke="#2663eb" strokeWidth="2.2"/>
            <g id="b">
              <g id="c">
                <rect x="5.5" y="5.5" width="42.4" height="43" rx="9.4" ry="9.4" fill="#2663eb"/>
                <rect x="16.9" y="13.5" width="16.9" height="9" rx="4.3" ry="4.3" transform="translate(-5.3 23.2) rotate(-45)" fill="#fff"/>
                <rect x="17.5" y="30.8" width="16.9" height="9" rx="4.3" ry="4.3" transform="translate(-17.4 28.7) rotate(-45)" fill="#fff"/>
                <ellipse cx="14.2" cy="28.9" rx="4.4" ry="4.4" fill="#fff"/>
                <ellipse cx="37" cy="24.4" rx="4.4" ry="4.4" fill="#fff"/>
              </g>
            </g>
            <g isolation="isolate">
              <path d="M53.6,21v-6.7h2.6c1.6,0,2.5.8,2.5,2.2s-.4,1.5-1.1,1.9l1.2,2.6h-1.6l-1-2.3h-1.1v2.3h-1.5ZM55,17.4h1.1c.6,0,1-.3,1-.9s-.4-.9-1-.9h-1.1v1.8Z"/>
              <path d="M59.8,21v-6.7h4.2v1.4h-2.8v1.3h2.5v1.3h-2.5v1.4h2.8v1.4h-4.2Z"/>
              <path d="M64.8,17.7c0-2.1,1.3-3.4,3.3-3.4s2.9,1,3.1,2.4h-1.5c-.2-.7-.8-1-1.6-1s-1.7.8-1.7,2,.7,2,1.7,2,1.4-.4,1.6-1.1h1.5c-.2,1.5-1.5,2.5-3.1,2.5s-3.2-1.3-3.2-3.4Z"/>
              <path d="M75.1,21.1c-1.9,0-3.2-1.4-3.2-3.4s1.3-3.4,3.3-3.4,3.3,1.4,3.3,3.4-1.3,3.4-3.3,3.4ZM75.1,15.6c-1.1,0-1.7.8-1.7,2s.6,2,1.7,2,1.7-.8,1.7-2-.6-2-1.7-2Z"/>
              <path d="M79.3,21v-6.7h1.4l2,5,2-5h1.4v6.7h-1.4v-1.4c0-1.4,0-1.8,0-2.3l-1.4,3.6h-1.3l-1.4-3.6c0,.5,0,1.1,0,1.8v1.9h-1.4Z"/>
              <path d="M87.5,21v-6.7h1.4l2,5,2-5h1.4v6.7h-1.4v-1.4c0-1.4,0-1.8,0-2.3l-1.4,3.6h-1.3l-1.4-3.6c0,.5,0,1.1,0,1.8v1.9h-1.4Z"/>
              <path d="M95.1,21l2.4-6.7h1.4l2.4,6.7h-1.5l-.5-1.4h-2.2l-.5,1.4h-1.5ZM97.6,18.4h1.3l-.5-1.4c0-.2-.2-.5-.2-.6,0,.2,0,.4-.2.6l-.5,1.4Z"/>
              <path d="M102.1,21v-6.7h1.4l2.8,4.2v-4.2h1.4v6.7h-1.4l-2.8-4.2v4.2h-1.4Z"/>
              <path d="M109.1,21v-6.7h2.5c2,0,3.3,1.4,3.3,3.3s-1.3,3.3-3.2,3.3h-2.6ZM110.6,15.7v4h1c1.2,0,1.8-.7,1.8-2s-.7-2-1.9-2h-.9Z"/>
              <path d="M116,21v-6.7h4.2v1.4h-2.8v1.3h2.5v1.3h-2.5v1.4h2.8v1.4h-4.2ZM118.6,13.9h-1l.8-1.5h1.2l-1,1.5Z"/>
              <path d="M125.9,14.2c1.4,0,2.3.8,2.3,2.1h-1.4c0-.5-.4-.8-.9-.8s-1,.3-1,.7.2.6.7.7l1,.2c1.2.2,1.8.8,1.8,1.9s-1,2.1-2.5,2.1-2.4-.8-2.4-2.1h1.4c0,.5.4.8,1,.8s1.1-.3,1.1-.7-.2-.6-.6-.6l-1-.2c-1.2-.2-1.8-.9-1.8-2s1-2.1,2.4-2.1Z"/>
              <path d="M129.2,14.3h1.5v4.1c0,.8.5,1.3,1.3,1.3s1.3-.5,1.3-1.3v-4.1h1.5v4.2c0,1.6-1.1,2.6-2.8,2.6s-2.7-1-2.7-2.6v-4.2Z"/>
              <path d="M136.1,21v-6.7h2.6c1.6,0,2.5.8,2.5,2.2s-.4,1.5-1.1,1.9l1.2,2.6h-1.6l-1-2.3h-1.1v2.3h-1.5ZM137.5,17.4h1.1c.6,0,1-.3,1-.9s-.4-.9-1-.9h-1.1v1.8Z"/>
            </g>
            <path d="M56.4,34.7v6.5h-2.8v-15.9h9.8v2.6h-7v4.3h5.9v2.5h-5.9Z"/>
            <path d="M71,32.9h-1c-1.9,0-3.1,1-3.1,3.1v5.2h-2.7v-10.7h2.5l.2,1.6c.5-1.1,1.5-1.8,2.9-1.8s.7,0,1.2.2v2.5h0Z"/>
            <path d="M71.2,38.2c0-2,1.4-3.2,4-3.4l3.2-.2v-.2c0-1.5-.9-2-2.2-2s-2.4.7-2.4,1.8h-2.3c0-2.3,1.9-3.8,4.8-3.8s4.7,1.6,4.7,4.5v6.5h-2.3l-.2-1.6c-.5,1.1-1.9,1.9-3.6,1.9s-3.7-1.3-3.7-3.3h0ZM78.5,36.9v-.6l-2.2.2c-1.7.2-2.3.7-2.3,1.6s.7,1.5,1.8,1.5,2.7-1,2.7-2.6h0Z"/>
            <path d="M83,41.2v-10.7h2.5l.2,1.4c.7-1.1,2-1.7,3.4-1.7,2.7,0,4.1,1.7,4.1,4.5v6.6h-2.7v-6c0-1.8-.9-2.7-2.3-2.7s-2.6,1.1-2.6,2.9v5.8h-2.7,0Z"/>
            <path d="M99.9,30.2c2.9,0,4.9,1.6,5.2,4.2h-2.7c-.3-1.2-1.2-1.8-2.5-1.8s-2.8,1.3-2.8,3.3,1,3.3,2.7,3.3,2.3-.7,2.5-1.8h2.7c-.3,2.5-2.4,4.2-5.2,4.2s-5.4-2.3-5.4-5.7,2.2-5.7,5.4-5.7h0Z"/>
            <path d="M105.9,35.9c0-3.4,2.2-5.7,5.3-5.7s5.3,2.2,5.3,5.5v.8h-8.1c.2,1.9,1.2,2.9,3,2.9s2.4-.6,2.7-1.6h2.5c-.5,2.3-2.4,3.8-5.2,3.8s-5.4-2.3-5.4-5.7h0ZM108.5,34.8h5.4c0-1.5-1-2.5-2.6-2.5s-2.5.8-2.8,2.5Z"/>
            <path d="M123.1,25.1c3.2,0,5.3,1.8,5.3,4.7h-2.8c0-1.4-1-2.2-2.6-2.2s-2.8.8-2.8,2.2.6,1.8,1.9,2.1l2.5.5c2.7.6,4,2,4,4.3s-2.3,4.9-5.8,4.9-5.6-1.8-5.7-4.7h2.8c0,1.3,1.1,2.2,2.9,2.2s3-.8,3-2.1-.5-1.7-1.8-2l-2.5-.6c-2.7-.6-4.1-2.1-4.1-4.6s2.3-4.7,5.7-4.7h0Z" fill="#2663eb"/>
            <path d="M129.7,38.2c0-2,1.4-3.2,4-3.4l3.2-.2v-.2c0-1.5-.9-2-2.2-2s-2.4.7-2.4,1.8h-2.3c0-2.3,1.9-3.8,4.8-3.8s4.7,1.6,4.7,4.5v6.5h-2.3l-.2-1.6c-.5,1.1-1.9,1.9-3.6,1.9s-3.7-1.3-3.7-3.3h0ZM137,36.9v-.6l-2.2.2c-1.7.2-2.3.7-2.3,1.6s.7,1.5,1.8,1.5,2.7-1,2.7-2.6h0Z" fill="#2663eb"/>
            <path d="M141,38.2c0-2,1.4-3.2,4-3.4l3.2-.2v-.2c0-1.5-.9-2-2.2-2s-2.4.7-2.4,1.8h-2.3c0-2.3,1.9-3.8,4.8-3.8s4.7,1.6,4.7,4.5v6.5h-2.3l-.2-1.6c-.5,1.1-1.9,1.9-3.6,1.9s-3.7-1.3-3.7-3.3h0ZM148.2,36.9v-.6l-2.2.2c-1.7.2-2.3.7-2.3,1.6s.7,1.5,1.8,1.5,2.7-1,2.7-2.6h0Z" fill="#2663eb"/>
            <path d="M157.9,25.1c3.2,0,5.3,1.8,5.3,4.7h-2.8c0-1.4-1-2.2-2.6-2.2s-2.8.8-2.8,2.2.6,1.8,1.9,2.1l2.5.5c2.7.6,4,2,4,4.3s-2.3,4.9-5.8,4.9-5.6-1.8-5.7-4.7h2.8c0,1.3,1.1,2.2,2.9,2.2s3-.8,3-2.1-.5-1.7-1.8-2l-2.5-.6c-2.7-.6-4.1-2.1-4.1-4.6s2.3-4.7,5.7-4.7h0Z" fill="#2663eb"/>
          </svg>
              </a>
          </div>
        </section>

      </div>
    </footer>
  );
};

export default Footer;
