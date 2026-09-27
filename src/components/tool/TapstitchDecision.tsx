import { ArrowRight } from "@/lib/icons";
import { trackEvent } from "@/lib/analytics";

/** Product-buying guidance, not a SaaS score or an untested textile rating. */
export default function TapstitchDecision({ t, compact = false }: {
  t: (fr: string, en: string) => string;
  compact?: boolean;
}) {
  return <section className="td-tapstitch-decision">
    <h2 className={compact ? "td-review-label" : "td-title"}>{t("Est-ce adapté à votre marque ?", "Is it right for your brand?")}</h2>
    <p>{t("Pour les créateurs de marques et boutiques qui veulent proposer leurs designs sur des vêtements, sans acheter un stock à l’avance.", "For brands and stores that want to put their designs on clothing without buying inventory upfront.")}</p>
    {!compact && <ol>
      <li><strong>{t("Choisissez votre vêtement.", "Choose your garment.")}</strong> {t("Comparez les coupes, matières et tailles du catalogue.", "Compare the catalog’s cuts, fabrics and sizes.")}</li>
      <li><strong>{t("Ajoutez votre design.", "Add your design.")}</strong> {t("Vérifiez les zones d’impression et le coût du produit personnalisé.", "Check the print areas and the customized product cost.")}</li>
      <li><strong>{t("Commandez un échantillon.", "Order a sample.")}</strong> {t("Contrôlez le rendu, la taille et la tenue au lavage avant de le proposer à vos clients.", "Check the print, fit and wash performance before offering it to customers.")}</li>
    </ol>}
    <a className="td-hero-site-link" href="https://affiliate.tapstitch.com/9xmwrs4csvpu" target="_blank" rel="sponsored noopener noreferrer"
      onClick={() => trackEvent("outbound_tool_click", { tool_slug: "tapstitch", cta_location: compact ? "tool_sidebar" : "tool_review", is_affiliate: true })}>
      {t("Créer mon premier produit", "Create my first product")}<ArrowRight aria-hidden />
    </a>
    <p className="td-tapstitch-note">{t("À prévoir : produit, impression et livraison. Vérifiez le total, les délais et les conditions de retour pour votre destination.", "Budget for the product, printing and shipping. Check the total, delivery times and return terms for your destination.")}</p>
    {!compact && <p className="td-tapstitch-note">{t("Nous n’avons pas testé de commande : la qualité textile et l’impression ne sont pas notées.", "We have not placed a test order: fabric and print quality are not rated.")}</p>}
  </section>;
}
