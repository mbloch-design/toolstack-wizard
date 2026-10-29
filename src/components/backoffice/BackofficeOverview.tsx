import { Button, ActionRow } from "@/components/ui/primitives";
import { useLang } from "@/hooks/useLang";
import type { AccountsDashboard } from "@/lib/backofficeAccounts";
import { ArrowRight } from "@/lib/icons";
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
      <button className="bo-metric" onClick={onUsers}>
        <span>{t("Comptes confirmés", "Confirmed accounts")}</span>
        <strong className="bo-figure" data-testid="accounts-total">
          {data.totals.accounts}
        </strong>
        <small>
          {t("Comptes actifs dans le périmètre", "Active accounts in scope")}
          <ArrowRight size={16} aria-hidden />
        </small>
      </button>
      <button className="bo-metric" onClick={onUsers}>
        <span>
          {t("Comptes avec une sauvegarde", "Accounts with a saved stack")}
        </span>
        <strong className="bo-figure">{data.totals.accountsWithStack}</strong>
        <small>
          {t("État personnel synchronisé", "Synchronized personal state")}
          <ArrowRight size={16} aria-hidden />
        </small>
      </button>
      <button className="bo-metric" onClick={onUsers}>
        <span>{t("Stacks non vides", "Nonempty stacks")}</span>
        <strong className="bo-figure">{data.totals.nonemptyStacks}</strong>
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
        <section className="bo-card bo-registrations">
          <div className="bo-section-heading">
            <h2>{t("Inscriptions récentes", "Recent registrations")}</h2>
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
                <ActionRow
                  lead={
                    <span className="bo-initial">
                      {(account.displayName || account.email || "?")
                        .slice(0, 1)
                        .toUpperCase()}
                    </span>
                  }
                  name={account.displayName || account.email || account.userId}
                  sub={`${tradeLabel(account.insights?.trade, lang)} · ${date(account.createdAt, lang)}`}
                  onClick={() => onUser(account.userId)}
                />
              </li>
            ))}
          </ul>
          {data.accounts.length === 0 && (
            <p className="bo-empty">
              {t("Aucun compte confirmé.", "No confirmed accounts.")}
            </p>
          )}
          <Button variant="quiet" onClick={onUsers}>
            {t("Tous les utilisateurs", "All users")}
            <ArrowRight size={15} aria-hidden />
          </Button>
        </section>
        <div className="bo-ranking-group">
          <ToolsRanking data={data} compact />
          <Button variant="quiet" onClick={onStacks}>
            {t(
              "Explorer tous les outils sauvegardés",
              "Explore all saved tools",
            )}
            <ArrowRight size={15} aria-hidden />
          </Button>
        </div>
      </div>
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
