import { useLang } from "@/hooks/useLang";

const DiffTable = () => {
  const { t } = useLang();

  const decisions = [
    {
      sign: "+",
      labelFr: "Garder",
      labelEn: "Keep",
      titleFr: "L'outil a un rôle clair.",
      titleEn: "The tool has a clear role.",
      textFr: "Utilisé chaque semaine, intégré à ton workflow.",
      textEn: "Used every week, integrated into your workflow.",
    },
    {
      sign: "–",
      labelFr: "Couper",
      labelEn: "Cut",
      titleFr: "L'outil dort ou fait doublon.",
      titleEn: "The tool is dormant or redundant.",
      textFr: "Payé tous les mois, ouvert deux fois par trimestre.",
      textEn: "Paid every month, opened twice per quarter.",
    },
    {
      sign: "→",
      labelFr: "Remplacer",
      labelEn: "Replace",
      titleFr: "L'outil est trop lourd pour ton usage.",
      titleEn: "The tool is too heavy for your usage.",
      textFr: "Une alternative plus légère couvre déjà le besoin.",
      textEn: "A lighter alternative already covers the need.",
    },
  ];

  return (
    <section className="home-position-section">
      <div className="layout-shell">
        <div className="home-position-grid">
          <div>
            <p className="home-position-eyebrow">{t("Notre position", "Our position")}</p>
            <h2 className="home-position-title">
              {t("Pas un annuaire. Un outil de tri.", "Not a directory. A sorting tool.")}
            </h2>
          </div>

          <div>
            <div className="home-position-intro">
              <p>{t("ToolTrim ne cherche pas à tout lister.", "ToolTrim does not try to list everything.")}</p>
              <p>{t("Il aide à faire le tri.", "It helps you sort.")}</p>
              <p>
                {t(
                  "Chaque outil doit avoir un rôle clair dans ta stack. Sinon, c'est juste un abonnement de plus.",
                  "Every tool needs a clear role in your stack. Otherwise, it is just one more subscription."
                )}
              </p>
            </div>

            <div className="home-decision-module">
              {decisions.map((decision) => (
                <div className="home-decision-row" key={decision.labelFr}>
                  <div className="home-decision-label">
                    <span className="home-decision-sign">{decision.sign}</span>
                    {t(decision.labelFr, decision.labelEn)}
                  </div>
                  <div>
                    <p className="home-decision-main">{t(decision.titleFr, decision.titleEn)}</p>
                    <p className="home-decision-secondary">{t(decision.textFr, decision.textEn)}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="home-position-closing">
              {t("Chaque outil doit justifier sa place.", "Every tool has to justify its place.")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DiffTable;
