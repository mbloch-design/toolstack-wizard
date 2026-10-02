import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronRight, CirclePlus, Languages, Moon, Sun, X } from "@/lib/icons";
import { CATALOG_NEEDS } from "@/data/catalogNeeds";
import bestOfGuides from "@/data/bestOfGuides.json";
import type { Currency } from "@/hooks/useCurrency";

/**
 * Menu mobile (US-NAV-01). Le mobile n'est pas une réduction du bureau :
 *
 * - un seul niveau visible à la fois ; un sous-niveau remplace le niveau
 *   principal au lieu de s'empiler, et « Retour » remonte d'un cran ;
 * - les fonctions secondaires (langue, devise, thème, soumettre un outil),
 *   qui ne vivaient que dans la barre latérale masquée en mobile, y trouvent
 *   leur place ;
 * - Échap ferme, le focus reste dans le panneau tant qu'il est ouvert et
 *   revient sur le bouton Menu à la fermeture ; aucun survol nécessaire.
 *
 * La barre d'onglets du bas reste la navigation principale au pouce : ce
 * menu donne la carte complète du site, il ne la remplace pas.
 */

type Level = "root" | "tools" | "guides";

type NavItem = { id: string; labelFr: string; labelEn: string; to: string };

interface Props {
  open: boolean;
  onClose: () => void;
  prefix: string;
  lang: "fr" | "en";
  t: (fr: string, en: string) => string;
  items: NavItem[];
  activeId: string | null;
  languageHref: string;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  theme: string;
  toggleTheme: () => void;
}

const CURRENCIES: Currency[] = ["EUR", "USD", "GBP"];

export default function MobileMenu({ open, onClose, prefix, lang, t, items, activeId, languageHref, currency, setCurrency, theme, toggleTheme }: Props) {
  const [level, setLevel] = useState<Level>("root");
  const panelRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Chaque ouverture repart du niveau principal.
  useEffect(() => {
    if (open) setLevel("root");
  }, [open]);

  // Focus sur le titre du niveau affiché, pour que le lecteur d'écran annonce le changement.
  useEffect(() => {
    if (open) headingRef.current?.focus();
  }, [open, level]);

  // Échap, piège de focus et page figée derrière le panneau.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (level !== "root") setLevel("root");
        else onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex="0"]');
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, level, onClose]);

  if (!open) return null;

  const L = (fr: string, en: string) => t(fr, en);
  const titles: Record<Level, string> = { root: L("Menu", "Menu"), tools: L("Outils", "Tools"), guides: L("Guides", "Guides") };
  const hasLevel = (id: string): Level | null => (id === "tools" ? "tools" : id === "guides" ? "guides" : null);

  return (
    <div className="asv2-mm" role="presentation">
      <button type="button" className="asv2-mm-backdrop" aria-label={L("Fermer le menu", "Close menu")} tabIndex={-1} onClick={onClose} />
      <div ref={panelRef} className="asv2-mm-panel" role="dialog" aria-modal="true" aria-labelledby="asv2-mm-title">
        <div className="asv2-mm-head">
          {level !== "root" ? (
            <button type="button" className="asv2-mm-icon-btn" onClick={() => setLevel("root")} aria-label={L("Retour au menu", "Back to menu")}>
              <ArrowLeft aria-hidden />
            </button>
          ) : <span className="asv2-mm-icon-spacer" aria-hidden />}
          <h2 id="asv2-mm-title" ref={headingRef} tabIndex={-1} className="asv2-mm-title">{titles[level]}</h2>
          <button type="button" className="asv2-mm-icon-btn" onClick={onClose} aria-label={L("Fermer le menu", "Close menu")}>
            <X aria-hidden />
          </button>
        </div>

        <div className="asv2-mm-body" key={level}>
          {level === "root" && (
            <>
              <nav aria-label={L("Sections", "Sections")}>
                <ul className="asv2-mm-list">
                  {items.map((item) => {
                    const sub = hasLevel(item.id);
                    const label = L(item.labelFr, item.labelEn);
                    return (
                      <li key={item.id} className="asv2-mm-row">
                        <Link
                          to={`${prefix}${item.to}`}
                          onClick={onClose}
                          className={`asv2-mm-link${activeId === item.id ? " is-active" : ""}`}
                          aria-current={activeId === item.id ? "page" : undefined}
                        >
                          {label}
                        </Link>
                        {sub && (
                          <button type="button" className="asv2-mm-drill" onClick={() => setLevel(sub)} aria-label={L(`Ouvrir ${label}`, `Open ${label}`)}>
                            <ChevronRight aria-hidden />
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <section className="asv2-mm-prefs" aria-labelledby="asv2-mm-prefs">
                <h3 id="asv2-mm-prefs" className="asv2-mm-subtitle">{L("Préférences", "Preferences")}</h3>
                <a href={languageHref} className="asv2-mm-pref" onClick={onClose}>
                  <Languages aria-hidden />
                  <span>{L("Langue", "Language")}</span>
                  <strong>{lang === "fr" ? "English" : "Français"}</strong>
                </a>
                <div className="asv2-mm-pref asv2-mm-pref--static">
                  <span className="asv2-mm-pref-label" id="asv2-mm-currency">{L("Devise", "Currency")}</span>
                  <div className="asv2-mm-segment" role="radiogroup" aria-labelledby="asv2-mm-currency">
                    {CURRENCIES.map((code) => (
                      <button key={code} type="button" role="radio" aria-checked={currency === code} className={currency === code ? "is-selected" : ""} onClick={() => setCurrency(code)}>
                        {code}
                      </button>
                    ))}
                  </div>
                </div>
                <button type="button" className="asv2-mm-pref" onClick={toggleTheme} aria-pressed={theme === "dark"}>
                  {theme === "dark" ? <Sun aria-hidden /> : <Moon aria-hidden />}
                  <span>{L("Thème", "Theme")}</span>
                  <strong>{theme === "dark" ? L("Sombre", "Dark") : L("Clair", "Light")}</strong>
                </button>
              </section>

              <Link to={`${prefix}/submit`} onClick={onClose} className="asv2-mm-submit">
                <CirclePlus aria-hidden />
                {L("Soumettre un outil", "Submit a tool")}
              </Link>
            </>
          )}

          {level === "tools" && (
            <nav aria-label={L("Outils", "Tools")}>
              <ul className="asv2-mm-list">
                <li className="asv2-mm-row"><Link to={`${prefix}/tools`} onClick={onClose} className="asv2-mm-link">{L("Tous les outils", "All tools")}</Link></li>
                <li className="asv2-mm-row"><Link to={`${prefix}/category`} onClick={onClose} className="asv2-mm-link">{L("Toutes les catégories", "All categories")}</Link></li>
              </ul>
              <h3 className="asv2-mm-subtitle">{L("Par besoin", "By need")}</h3>
              <ul className="asv2-mm-list">
                {CATALOG_NEEDS.map((need) => (
                  <li key={need.id} className="asv2-mm-row">
                    <Link to={`${prefix}/tools?need=${need.id}`} onClick={onClose} className="asv2-mm-link">{lang === "fr" ? need.fr : need.en}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {level === "guides" && (
            <nav aria-label={L("Guides", "Guides")}>
              <ul className="asv2-mm-list">
                <li className="asv2-mm-row"><Link to={`${prefix}/guides`} onClick={onClose} className="asv2-mm-link">{L("Tous les guides", "All guides")}</Link></li>
              </ul>
              <h3 className="asv2-mm-subtitle">{L("Comparatifs par besoin", "Comparisons by need")}</h3>
              <ul className="asv2-mm-list">
                {bestOfGuides.guides.map((g) => (
                  <li key={g.id} className="asv2-mm-row">
                    <Link to={`${prefix}/guide/${g.slug[lang]}`} onClick={onClose} className="asv2-mm-link">{g.h1[lang]}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
