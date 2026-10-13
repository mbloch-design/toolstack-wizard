import { useEffect } from "react";
import { useLang } from "@/hooks/useLang";
import { setSeoTags, setHreflang, setNoindex, cleanupSeo, SEO_BASE } from "@/lib/seo";
import Breadcrumb from "@/components/Breadcrumb";

const PrivacyPolicyPage = () => {
  const { t, lang } = useLang();

  useEffect(() => {
    setSeoTags({
      title: t("Politique de confidentialité — ToolTrim", "Privacy Policy — ToolTrim"),
      description: t("Comment ToolTrim collecte, utilise et protège vos données personnelles.", "How ToolTrim collects, uses, and protects your personal data."),
      url: `${SEO_BASE}/${lang}/privacy-policy`,
    });
    setNoindex();
    setHreflang(`/${lang}/privacy-policy`);
    return () => cleanupSeo([]);
  }, [lang, t]);

  return (
    <div className="py-16 md:py-24">
      <Breadcrumb items={[{ label: t("Politique de confidentialité", "Privacy Policy") as string }]} />
      <div className="container mx-auto max-w-3xl">
        <span className="inline-block rounded-full bg-accent px-4 py-1.5 text-xs font-medium text-accent-foreground mb-6">
          {t("Légal", "Legal")}
        </span>
        <h1 className="font-heading text-4xl font-bold tracking-tight">
          {t("Politique de confidentialité", "Privacy Policy")}
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          {t("Dernière mise à jour : 12 octobre 2026", "Last updated: October 12, 2026")}
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">{t("Données collectées", "Data Collected")}</h2>
            <p>{t("ToolTrim collecte les données suivantes :", "ToolTrim collects the following data:")}</p>
            <ul className="mt-2 space-y-1 pl-4 list-disc">
              <li>{t("Email (via le formulaire de diagnostic ou de contact)", "Email (via the diagnostic or contact form)")}</li>
              <li>{t("Prénom (optionnel)", "First name (optional)")}</li>
              <li>{t("Outils sélectionnés dans le diagnostic", "Tools selected in the diagnostic")}</li>
              <li>{t("Profil utilisateur (type d'activité, maturité tech)", "User profile (activity type, tech maturity)")}</li>
              <li>{t("Signaux de mesure limités sans cookies via Google Analytics ; cookies et interactions détaillées uniquement après consentement", "Limited cookieless measurement signals via Google Analytics; cookies and detailed interactions only after consent")}</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">{t("Finalité du traitement", "Purpose of Processing")}</h2>
            <ul className="space-y-1 pl-4 list-disc">
              <li>{t("Générer vos résultats de diagnostic personnalisés", "Generate your personalized diagnostic results")}</li>
              <li>{t("Améliorer la qualité de nos recommandations", "Improve the quality of our recommendations")}</li>
              <li>{t("Vous recontacter si vous avez opté pour le suivi", "Follow up if you opted in for communication")}</li>
              <li>{t("Analyser le trafic du site de manière agrégée", "Analyze site traffic in aggregate")}</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">{t("Partage des données", "Data Sharing")}</h2>
            <p>{t(
              "Vos données ne sont jamais revendues à des tiers. Elles peuvent être partagées avec :",
              "Your data is never resold to third parties. It may be shared with:"
            )}</p>
            <ul className="mt-2 space-y-1 pl-4 list-disc">
              <li><strong>Supabase</strong> — {t("hébergement de la base de données (UE)", "database hosting (EU)")}</li>
              <li><strong>Google Analytics</strong> — {t("Consent Mode avancé : signaux limités sans cookies avant accord ou après refus ; cookies et interactions détaillées après accord", "advanced Consent Mode: limited cookieless signals before consent or after refusal; cookies and detailed interactions after consent")}</li>
              <li><strong>DataFast et Vercel Web Analytics</strong> — {t("mesure d’audience sans cookies d’identification persistants, chargée indépendamment du choix Google Analytics", "audience measurement without persistent identification cookies, loaded independently of the Google Analytics choice")}</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">{t("Conservation des données", "Data Retention")}</h2>
            <p>{t(
              "Les données de diagnostic sont conservées 24 mois maximum. Les données de contact sont conservées le temps nécessaire au traitement de votre demande.",
              "Diagnostic data is retained for a maximum of 24 months. Contact data is retained for the time necessary to process your request."
            )}</p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">{t("Vos droits (RGPD)", "Your Rights (GDPR)")}</h2>
            <p>{t(
              "Conformément au RGPD, vous disposez des droits suivants :",
              "In accordance with GDPR, you have the following rights:"
            )}</p>
            <ul className="mt-2 space-y-1 pl-4 list-disc">
              <li>{t("Droit d'accès à vos données", "Right to access your data")}</li>
              <li>{t("Droit de rectification", "Right to rectification")}</li>
              <li>{t("Droit à l'effacement", "Right to erasure")}</li>
              <li>{t("Droit à la portabilité", "Right to data portability")}</li>
              <li>{t("Droit d'opposition au traitement", "Right to object to processing")}</li>
            </ul>
            <p className="mt-3">{t(
              "Pour exercer ces droits, contactez-nous à : contact@tooltrim.com",
              "To exercise these rights, contact us at: contact@tooltrim.com"
            )}</p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">Cookies</h2>
            <p>{t(
              "Google Analytics est chargé dès la visite avec le stockage analytique et publicitaire refusé par défaut. Des signaux limités sont transmis à Google sans cookies analytiques, avant votre choix et même après un refus. Les cookies analytiques et les interactions détaillées ne sont activés qu’après votre accord. Ce fonctionnement ne constitue pas une mesure d’audience exemptée de consentement validée par la CNIL. Accepter et refuser sont proposés au même niveau. Votre choix est conservé six mois dans ce navigateur ; les anciens choix sans date sont redemandés. Vous pouvez le modifier ou retirer votre accord à tout moment via « Préférences cookies » en pied de page. Le retrait supprime les cookies Google Analytics accessibles et recharge la page pour revenir à la mesure limitée sans cookies. Si le stockage local est indisponible, votre choix s’applique à la session de page. Les mesures DataFast et Vercel restent indépendantes de ce choix et n’utilisent pas de cookies d’identification persistants.",
              "Google Analytics loads on arrival with analytics and advertising storage denied by default. Limited signals are sent to Google without analytics cookies, before your choice and even after refusal. Analytics cookies and detailed interactions are enabled only after you agree. This does not constitute a CNIL-validated consent-exempt audience measurement solution. Accept and refuse are offered at the same level. Your choice is stored for six months in this browser; older undated choices are requested again. You can change it or withdraw consent at any time using “Cookie preferences” in the footer. Withdrawal deletes accessible Google Analytics cookies and reloads the page to return to limited cookieless measurement. If local storage is unavailable, your choice applies to the page session. DataFast and Vercel measurement remains independent of this choice and does not use persistent identification cookies."
            )}</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
