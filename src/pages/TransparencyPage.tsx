import { useLang } from "@/hooks/useLang";

const TransparencyPage = () => {
  const { t } = useLang();
  return (
    <div className="py-12">
      <div className="container mx-auto max-w-2xl">
        <h1 className="font-heading text-3xl font-bold">{t("Transparence", "Transparency")}</h1>
        <div className="mt-6 space-y-4 text-muted-foreground">
          <p>{t(
            "Tooltrim utilise des liens affiliés sur certains outils recommandés. Cela signifie que si vous cliquez sur un lien et souscrivez à un outil, nous recevons une petite commission — sans surcoût pour vous.",
            "Tooltrim uses affiliate links on some recommended tools. This means if you click a link and subscribe to a tool, we receive a small commission — at no extra cost to you."
          )}</p>
          <p className="font-medium text-foreground">{t(
            "Nos recommandations ne sont jamais influencées par les commissions.",
            "Our recommendations are never influenced by commissions."
          )}</p>
          <p>{t(
            "Nous recommandons uniquement les outils que nous jugeons pertinents pour votre profil. Aucun « sponsored content », aucune publicité.",
            "We only recommend tools we deem relevant for your profile. No sponsored content, no ads."
          )}</p>
        </div>
      </div>
    </div>
  );
};

export default TransparencyPage;
