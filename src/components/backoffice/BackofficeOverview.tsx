import { useLang } from "@/hooks/useLang";
import type { AccountsDashboard } from "@/lib/backofficeAccounts";
import { ArrowRight, CheckCircle2 } from "@/lib/icons";
import { date, ToolName, tradeLabel } from "./backofficeDisplay";

export function OverviewMetrics({
  data,
  onUsers,
}: {
  data: AccountsDashboard;
  onUsers: () => void;
}) {
  const { t } = useLang();
  return (
    <div className="bo-metrics">
      <button onClick={onUsers}>
        <span>{t("Comptes confirmés", "Confirmed accounts")}</span>
        <strong data-testid="accounts-total">{data.totals.accounts}</strong>
        <small>
          {t("Comptes actifs dans le périmètre", "Active accounts in scope")}
          <ArrowRight size={16} aria-hidden />
        </small>
      </button>
      <button onClick={onUsers}>
        <span>
          {t("Comptes avec une sauvegarde", "Accounts with a saved stack")}
        </span>
        <strong>{data.totals.accountsWithStack}</strong>
        <small>
          {t("État personnel synchronisé", "Synchronized personal state")}
          <ArrowRight size={16} aria-hidden />
        </small>
      </button>
      <button onClick={onUsers}>
        <span>{t("Stacks non vides", "Nonempty stacks")}</span>
        <strong>{data.totals.nonemptyStacks}</strong>
        <small>
          {t("Au moins un outil sauvegardé", "At least one saved tool")}
          <ArrowRight size={16} aria-hidden />
        </small>
      </button>
    </div>
  );
}
export function ToolsRanking({
  data,
  compact = false,
}: {
  data: AccountsDashboard;
  compact?: boolean;
}) {
  const { t } = useLang();
  const tools = compact ? data.topTools.slice(0, 5) : data.topTools;
  return (
    <section className="bo-card bo-ranking">
      <div className="bo-section-heading">
        <h2>{t("Outils des stacks enregistrées", "Tools in saved stacks")}</h2>
        <span className="bo-tag">
          {data.totals.accountsWithStack}{" "}
          {t("comptes avec sauvegarde", "accounts with saved stacks")}
        </span>
      </div>
      <p className="bo-meta">
        {t(
          "Nombre de comptes distincts par outil. Ces chiffres ne mesurent ni achats ni satisfaction.",
          "Distinct account counts per tool. These figures do not measure purchases or satisfaction.",
        )}
      </p>
      {tools.length ? (
        <div className="bo-table-wrap">
          <table className="bo-table">
            <thead>
              <tr>
                <th>{t("Outil", "Tool")}</th>
                <th>{t("Utilisé", "Using")}</th>
                <th>{t("À étudier", "Considering")}</th>
              </tr>
            </thead>
            <tbody>
              {tools.map((tool) => (
                <tr key={tool.toolSlug}>
                  <td>
                    <ToolName slug={tool.toolSlug} />
                    {compact && (
                      <div className="bo-ranking-track" aria-hidden>
                        <span
                          style={{
                            width: `${data.totals.accountsWithStack ? Math.min(100, (tool.usedAccounts / data.totals.accountsWithStack) * 100) : 0}%`,
                          }}
                        />
                      </div>
                    )}
                  </td>
                  <td>{tool.usedAccounts}</td>
                  <td>{tool.wishlistAccounts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="bo-empty">
          {t("Aucun outil enregistré.", "No saved tools.")}
        </p>
      )}
    </section>
  );
}
export function BackofficeOverview({
  data,
  onUser,
  onUsers,
  onStacks,
}: {
  data: AccountsDashboard;
  onUser: (id: string) => void;
  onUsers: () => void;
  onStacks: () => void;
}) {
  const { lang, t } = useLang();
  return (
    <>
      <OverviewMetrics data={data} onUsers={onUsers} />
      <div className="bo-overview-grid">
        <section className="bo-card">
          <div className="bo-section-heading">
            <h2>{t("Inscriptions récentes", "Recent registrations")}</h2>
            <span className="bo-tag">
              {t("Comptes confirmés", "Confirmed accounts")}
            </span>
          </div>
          <p className="bo-meta">
            {t(
              "Les 5 inscriptions les plus récentes, indépendamment de la recherche.",
              "The 5 most recent registrations, independent of search.",
            )}
          </p>
          <ul className="bo-recent-list">
            {data.accounts.slice(0, 5).map((account) => (
              <li key={account.userId}>
                <button onClick={() => onUser(account.userId)}>
                  <span className="bo-initial" aria-hidden>
                    {(account.displayName || account.email || "?")
                      .slice(0, 1)
                      .toUpperCase()}
                  </span>
                  <span>
                    <strong>
                      {account.displayName || account.email || account.userId}
                    </strong>
                    <small>
                      {tradeLabel(account.insights?.trade, lang)} ·{" "}
                      {date(account.createdAt, lang)}
                    </small>
                  </span>
                  <ArrowRight size={17} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
          {data.accounts.length === 0 && (
            <p className="bo-empty">
              {t("Aucun compte confirmé.", "No confirmed accounts.")}
            </p>
          )}
          <button className="bo-text-button" onClick={onUsers}>
            {t("Tous les utilisateurs", "All users")}
            <ArrowRight size={15} aria-hidden />
          </button>
        </section>
        <section className="bo-card bo-reading">
          <span className="bo-eyebrow">
            {t("Comprendre vos utilisateurs", "Understand your users")}
          </span>
          <h2>{t("Au-delà de l’inscription", "Beyond registration")}</h2>
          <p>
            {t(
              "Ouvrez une fiche pour retrouver les outils choisis, leur usage, le budget déclaré et le contexte métier.",
              "Open a profile to explore tool choices, usage, declared budget and professional context.",
            )}
          </p>
          <ul>
            <li>
              <CheckCircle2 size={17} aria-hidden />
              {t("Sélections et tableaux", "Selections and boards")}
            </li>
            <li>
              <CheckCircle2 size={17} aria-hidden />
              {t(
                "Métier, TJM et abonnements déclarés",
                "Trade, daily rate and declared subscriptions",
              )}
            </li>
            <li>
              <CheckCircle2 size={17} aria-hidden />
              {t(
                "Usage et décisions enregistrées",
                "Saved usage and decisions",
              )}
            </li>
          </ul>
          <p className="bo-meta">
            {t(
              "Une rubrique vide reste signalée comme non renseignée.",
              "Empty fields remain marked as not provided.",
            )}
          </p>
        </section>
      </div>
      <ToolsRanking data={data} compact />
      <button className="bo-text-button" onClick={onStacks}>
        {t("Explorer tous les outils sauvegardés", "Explore all saved tools")}
        <ArrowRight size={15} aria-hidden />
      </button>
      <p className="bo-meta bo-source-note">
        {t(
          "Source : comptes confirmés actifs et snapshots sauvegardés. Totaux globaux, sans filtre de période. Dernière actualisation : ",
          "Source: active confirmed accounts and saved snapshots. Global totals, without period filtering. Last updated: ",
        )}
        {date(data.updatedAt, lang)}
      </p>
    </>
  );
}
