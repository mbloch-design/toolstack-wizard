import { useEffect } from "react";
import { useLang } from "@/hooks/useLang";
import { setSeoTags, setHreflang, cleanupSeo } from "@/lib/seo";

const LegalNoticePage = () => {
  const { t, lang } = useLang();

  useEffect(() => {
    setSeoTags({
      title: t("Mentions légales — ToolTrim", "Legal Notice — ToolTrim"),
      description: t("Mentions légales du site ToolTrim.io", "Legal notice for ToolTrim.io"),
      url: `https://tooltrim.io/${lang}/legal-notice`,
    });
    setHreflang(`/${lang}/legal-notice`);
    return () => cleanupSeo([]);
  }, [lang]);

  return (
    <div className="py-16 md:py-24">
      <div className="container mx-auto max-w-3xl">
        <span className="inline-block rounded-full bg-accent px-4 py-1.5 text-xs font-medium text-accent-foreground mb-6">
          {t("Légal", "Legal")}
        </span>
        <h1 className="font-heading text-4xl font-bold tracking-tight">
          {t("Mentions légales", "Legal Notice")}
        </h1>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">{t("Éditeur du site", "Site Publisher")}</h2>
            <p>{t("Le site tooltrim.io est édité par :", "The website tooltrim.io is published by:")}</p>
            <ul className="mt-2 space-y-1 pl-4 list-disc">
              <li><strong>{t("Raison sociale", "Company name")} :</strong> ToolTrim</li>
              <li><strong>{t("Forme juridique", "Legal form")} :</strong> {t("Micro-entreprise", "Sole proprietorship")}</li>
              <li><strong>{t("Adresse", "Address")} :</strong> France</li>
              <li><strong>Email :</strong> contact@tooltrim.io</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">{t("Hébergement", "Hosting")}</h2>
            <ul className="space-y-1 pl-4 list-disc">
              <li><strong>{t("Hébergeur", "Host")} :</strong> Lovable (lovable.dev)</li>
              <li><strong>{t("Infrastructure", "Infrastructure")} :</strong> Supabase (supabase.com)</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">{t("Propriété intellectuelle", "Intellectual Property")}</h2>
            <p>{t(
              "L'ensemble du contenu du site (textes, analyses, verdicts, design) est protégé par le droit d'auteur. Toute reproduction, même partielle, est interdite sans autorisation préalable.",
              "All site content (texts, analyses, verdicts, design) is protected by copyright. Any reproduction, even partial, is prohibited without prior authorization."
            )}</p>
            <p className="mt-2">{t(
              "Les logos et noms des outils référencés appartiennent à leurs propriétaires respectifs et sont utilisés à titre informatif.",
              "Logos and names of referenced tools belong to their respective owners and are used for informational purposes."
            )}</p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">{t("Liens affiliés", "Affiliate Links")}</h2>
            <p>{t(
              "Certains liens présents sur le site sont des liens affiliés. Lorsque vous cliquez sur ces liens et effectuez un achat, nous pouvons recevoir une commission sans surcoût pour vous. Ces liens sont toujours clairement identifiés.",
              "Some links on the site are affiliate links. When you click these links and make a purchase, we may receive a commission at no extra cost to you. These links are always clearly identified."
            )}</p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">{t("Responsabilité", "Liability")}</h2>
            <p>{t(
              "Les informations fournies sur ToolTrim le sont à titre indicatif. Malgré nos efforts pour maintenir des données exactes et à jour, nous ne garantissons pas l'exhaustivité ni l'exactitude des informations. Les prix et fonctionnalités des outils peuvent évoluer sans préavis.",
              "Information provided on ToolTrim is for informational purposes. Despite our efforts to maintain accurate and up-to-date data, we do not guarantee the completeness or accuracy of the information. Tool prices and features may change without notice."
            )}</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default LegalNoticePage;
