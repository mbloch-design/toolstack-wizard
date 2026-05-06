import { useEffect } from "react";
import { useLang } from "@/hooks/useLang";
import { setSeoTags, setHreflang, cleanupSeo } from "@/lib/seo";

const TermsPage = () => {
  const { t, lang } = useLang();

  useEffect(() => {
    setSeoTags({
      title: t("Conditions générales — ToolTrim", "Terms of Service — ToolTrim"),
      description: t("Conditions générales d'utilisation du site ToolTrim.io", "Terms of service for ToolTrim.io"),
      url: `https://www.tooltrim.com/${lang}/terms`,
    });
    setHreflang(`/${lang}/terms`);
    return () => cleanupSeo([]);
  }, [lang]);

  return (
    <div className="py-16 md:py-24">
      <div className="container mx-auto max-w-3xl">
        <span className="inline-block rounded-full bg-accent px-4 py-1.5 text-xs font-medium text-accent-foreground mb-6">
          {t("Légal", "Legal")}
        </span>
        <h1 className="font-heading text-4xl font-bold tracking-tight">
          {t("Conditions générales d'utilisation", "Terms of Service")}
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          {t("Dernière mise à jour : 14 mars 2026", "Last updated: March 14, 2026")}
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">{t("Objet", "Purpose")}</h2>
            <p>{t(
              "Les présentes conditions régissent l'utilisation du site tooltrim.com et de ses services, notamment le comparateur d'outils SaaS et le diagnostic de stack.",
              "These terms govern the use of the tooltrim.com website and its services, including the SaaS tool comparator and stack diagnostic."
            )}</p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">{t("Accès au service", "Access to Service")}</h2>
            <p>{t(
              "L'accès au site et à l'outil de diagnostic est gratuit. ToolTrim se réserve le droit de modifier, suspendre ou interrompre tout ou partie du service sans préavis.",
              "Access to the site and diagnostic tool is free. ToolTrim reserves the right to modify, suspend, or discontinue all or part of the service without notice."
            )}</p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">{t("Nature des recommandations", "Nature of Recommendations")}</h2>
            <p>{t(
              "Les recommandations fournies par ToolTrim sont à titre informatif et ne constituent pas un conseil professionnel. Les décisions d'achat, de résiliation ou de changement d'outil restent de la responsabilité de l'utilisateur.",
              "Recommendations provided by ToolTrim are informational and do not constitute professional advice. Purchase, cancellation, or tool change decisions remain the user's responsibility."
            )}</p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">{t("Liens affiliés", "Affiliate Links")}</h2>
            <p>{t(
              "Le site peut contenir des liens affiliés vers des services tiers. En cliquant sur ces liens et en effectuant un achat, ToolTrim peut percevoir une commission. Cela n'affecte ni le prix payé par l'utilisateur ni l'objectivité de nos recommandations.",
              "The site may contain affiliate links to third-party services. By clicking these links and making a purchase, ToolTrim may receive a commission. This affects neither the price paid by the user nor the objectivity of our recommendations."
            )}</p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">{t("Propriété intellectuelle", "Intellectual Property")}</h2>
            <p>{t(
              "Tous les contenus du site (textes, analyses, verdicts, design, code) sont la propriété de ToolTrim et protégés par les lois sur la propriété intellectuelle. Toute reproduction non autorisée est interdite.",
              "All site content (texts, analyses, verdicts, design, code) is the property of ToolTrim and protected by intellectual property laws. Unauthorized reproduction is prohibited."
            )}</p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">{t("Limitation de responsabilité", "Limitation of Liability")}</h2>
            <p>{t(
              "ToolTrim ne saurait être tenu responsable des dommages directs ou indirects résultant de l'utilisation du site ou des recommandations fournies. Les prix, fonctionnalités et disponibilités des outils référencés peuvent évoluer sans que ToolTrim en soit informé.",
              "ToolTrim shall not be held liable for direct or indirect damages resulting from the use of the site or recommendations provided. Prices, features, and availability of referenced tools may change without ToolTrim being notified."
            )}</p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">{t("Droit applicable", "Applicable Law")}</h2>
            <p>{t(
              "Les présentes conditions sont régies par le droit français. Tout litige relatif à l'utilisation du site sera soumis aux tribunaux compétents de France.",
              "These terms are governed by French law. Any dispute related to the use of the site will be submitted to the competent courts of France."
            )}</p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">Contact</h2>
            <p>{t(
              "Pour toute question relative aux présentes conditions, contactez-nous à : contact@tooltrim.com",
              "For any questions regarding these terms, contact us at: contact@tooltrim.com"
            )}</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
