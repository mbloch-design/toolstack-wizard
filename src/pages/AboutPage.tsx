import { useLang } from "@/hooks/useLang";
import { Link } from "react-router-dom";

const AboutPage = () => {
  const { t, prefix } = useLang();
  return (
    <div className="py-12">
      <div className="container mx-auto max-w-2xl">
        <h1 className="font-heading text-3xl font-bold">{t("À propos de Tooltrim", "About Tooltrim")}</h1>
        <div className="mt-6 space-y-4 text-muted-foreground">
          <p>{t(
            "Tooltrim est né d'un constat simple : les freelances et petites équipes paient trop cher pour des outils qu'ils n'utilisent pas pleinement.",
            "Tooltrim was born from a simple observation: freelancers and small teams overpay for tools they don't fully use."
          )}</p>
          <p>{t(
            "Notre mission est de vous aider à construire une stack d'outils minimaliste, efficace et adaptée à votre profil — sans abonnements superflus.",
            "Our mission is to help you build a minimal, efficient tool stack tailored to your profile — without unnecessary subscriptions."
          )}</p>
          <p>{t(
            "Nous analysons plus de 200 outils SaaS, comparons leurs fonctionnalités et tarifs, et vous recommandons uniquement ce qui fait sens pour vous.",
            "We analyze 200+ SaaS tools, compare their features and pricing, and recommend only what makes sense for you."
          )}</p>
        </div>
        <div className="mt-8">
          <Link to={`${prefix}/transparency`} className="text-sm text-primary hover:underline">
            {t("En savoir plus sur notre modèle →", "Learn more about our model →")}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
