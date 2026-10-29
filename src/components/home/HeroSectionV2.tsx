import { Link } from "@/lib/routerLinks";
import { ArrowRight } from "@/lib/icons";
import { useLang } from "@/hooks/useLang";
import { useStackPins } from "@/hooks/useStackPins";
import { HERO_GLYPHS } from "@/data/heroGlyphs";
import { useToolSummaries } from "@/hooks/useSupabaseData";
import ToolLogo from "@/components/ToolLogo";
import { useStackAccount } from "@/hooks/useStackAccount";
import { useAccountExperience } from "@/components/account/AccountExperienceProvider";
import { firstNameOf } from "@/components/stack/StackPersonalWelcome";

/** The ecosystem on three orbits (8, 14 and 20 tools on full circles, the same spacing along each arc, half visible from the stage's edge), as monochrome glyphs. */
const HERO_RINGS = [
  ["notion", "figma", "stripe", "openai", "slack", "github", "webflow", "airtable"],
  ["shopify", "linear", "dropbox", "hubspot", "mailchimp", "trello", "asana", "vercel", "miro", "framer", "googlemeet", "dribbble", "calendly", "grammarly"],
  ["googledrive", "gmail", "loom", "make", "supabase", "googlegemini", "todoist", "n8n", "clickup", "intercom", "discord", "jira", "typeform", "googlecalendar", "mixpanel", "quickbooks", "wordpress", "carrd", "buffer", "googleanalytics"],
];

const HeroSectionV2 = () => {
  const { t, lang, prefix } = useLang();
  const { state: cartState } = useStackPins();
  const cartCount = cartState.pinnedToolSlugs.length;
  // An active stack turns the main call into a preview of it: its first
  // three tools, « Resume my stack », and how many tools it holds.
  const { tools } = useToolSummaries();
  // Returning visitor (29 Oct 2026): no need to pitch the product again. A
  // signed-in person is greeted by the first name they chose (never from the
  // email); a local stack alone gets « your stack is waiting ». The
  // prerendered page stays the first-visit pitch.
  const { user, syncStatus } = useStackAccount();
  const { profile } = useAccountExperience();
  const signedIn = Boolean(user) && syncStatus !== "session-expired";
  const firstName = signedIn && profile?.userId === user?.id ? firstNameOf(profile?.displayName) : null;
  const hour = new Date().getHours();
  const evening = hour >= 18 || hour < 5;
  // Signed in: warm, polite, a little humour; the line follows the time of day.
  const greetingTitle = hour >= 5 && hour < 12
    ? t("Vos outils sont déjà au café.", "Your tools are already on their coffee.")
    : hour >= 12 && hour < 18
      ? t("Vos outils vous attendaient. Sagement.", "Your tools waited for you. Patiently.")
      : t("Vos outils font des heures sup. Vous, on espère que non.", "Your tools are working late. We hope you aren't.");
  const returning = cartCount > 0;
  const stackFaces = cartCount > 0 ? cartState.pinnedToolSlugs.flatMap((slug) => tools.find((tool) => tool.slug === slug || tool.id === slug) ?? []).slice(0, 3) : [];
  const cartLabel = cartCount > 0
    ? `${t("Ma stack", "My stack")} · ${cartCount}`
    : t("Construire ma stack", "Build my stack");

  return (
    <section className="hv2-root">
      <div className="hv2-container">
        {/* Hero (29 Oct 2026): the colour comes from the product, as on
            Apple's pages. Real app icons on a calm surface; behind them a
            glow in Display P3 (oklch) from the brand hues of the tools shown.
            The previous gradient artwork stays in /public/hero for a rollback. */}
        <div className="hv2-stage">
          <div className="hv2-content">
            <span className="hv2-eyebrow">
              {signedIn
                ? firstName ? t(`${evening ? "Bonsoir" : "Bonjour"}, ${firstName}`, `${evening ? "Good evening" : "Hello"}, ${firstName}`) : t(evening ? "Bonsoir" : "Bonjour", evening ? "Good evening" : "Hello")
                : returning ? t("Votre stack", "Your stack") : t("Pour les freelances et petites équipes", "For freelancers and small teams")}
            </span>

            <h1 className="hv2-title">
              {returning
                ? signedIn ? greetingTitle : t("Votre stack vous attend.", "Your stack is waiting.")
                : lang === "fr"
                  ? <>Décidez quels logiciels garder,<br />remplacer ou ajouter.</>
                  : <>Decide which software to keep,<br />replace, or add.</>}
            </h1>

            <p className="hv2-subtitle">
              {returning
                ? signedIn
                  ? t(`${cartCount} outil${cartCount > 1 ? "s" : ""}, tous à leur poste. Reprenez où vous en étiez : on vous a gardé la place au chaud.`, `${cartCount} tool${cartCount > 1 ? "s" : ""}, all at their desks. Pick up where you left off: we kept your seat warm.`)
                  : t(`${cartCount} outil${cartCount > 1 ? "s" : ""} dans votre stack. Reprenez où vous en étiez, ou voyez ce qui pourrait s’y ajouter.`, `${cartCount} tool${cartCount > 1 ? "s" : ""} in your stack. Pick up where you left off, or see what could join it.`)
                : t(
                  "Construisez votre stack et voyez où vous payez trop, ce qui fait doublon et ce qui vous manque.",
                  "Build your stack and see where you're overspending, overlapping, or missing the right tool.",
                )}
            </p>

            <div className="hv2-actions">
              <Link to={`${prefix}/ma-stack`} className={`hv2-cta${cartCount > 0 ? " hv2-cta--stack" : ""}`} aria-label={cartCount > 0 ? t(`Reprendre ma stack, ${cartCount} outil${cartCount > 1 ? "s" : ""}`, `Resume my stack, ${cartCount} tool${cartCount > 1 ? "s" : ""}`) : cartLabel}>
                {stackFaces.length > 0 && <span className="hv2-cta-faces" aria-hidden="true">{stackFaces.map((tool) => <ToolLogo key={tool.id} tool={tool} size={24} alt="" />)}</span>}
                <span>{cartCount > 0 ? t("Reprendre ma stack", "Resume my stack") : cartLabel}</span>
                {cartCount > 0 && <span className="hv2-cta-count" aria-hidden="true">{cartCount}</span>}
                <ArrowRight className="hv2-cta-arrow" aria-hidden />
              </Link>
              <Link to={`${prefix}/tools`} className="hv2-cta-secondary">
                <span>{t("Explorer les outils", "Explore tools")}</span>
                <ArrowRight className="hv2-cta-arrow" aria-hidden />
              </Link>
            </div>
          </div>

          <div className="hv2-apps" aria-hidden="true">
            <div className="hv2-apps-glow" />
            <div className="hv2-apps-glow hv2-apps-glow--b" />
            <div className="hv2-orbit">
              {/* The orbit lines: true vector circles, fixed; only the glyphs turn. */}
              <svg className="hv2-orbit-lines" viewBox="-440 -440 880 880" aria-hidden="true">{[170, 300, 430].map((r) => <circle key={r} r={r} />)}</svg>
              {HERO_RINGS.map((ring, r) => <ul key={r} className="hv2-ring" data-ring={r} style={{ ["--n" as string]: ring.length }}>
                {ring.map((slug, i) => <li key={slug} style={{ ["--i" as string]: i }}><span><svg viewBox="0 0 24 24" aria-hidden="true"><path d={HERO_GLYPHS[slug]} /></svg></span></li>)}
              </ul>)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSectionV2;
