import AccountAvatar from "@/components/account/AccountAvatar";
import { useEffect, useId, useState } from "react";
import { useLang } from "@/hooks/useLang";
import { loadAccountDetail, loadAccountsDashboard, type AccountDetail, type AccountsDashboard as DashboardData } from "@/lib/backofficeAccountsApi";
import toolsIndex from "@/data/tools_index.json";
import { RefreshCw, Search, Users } from "@/lib/icons";

// This index is the existing JSON catalogue. The generic catalogue hooks may
// refresh/cache historical Supabase rows, which are never an authority here.
const toolNames = new Map<string, { name: string; slug: string }>();
for (const tool of toolsIndex) {
  const value = { name: tool.name, slug: tool.slug || tool.id };
  toolNames.set(tool.id, value); toolNames.set(value.slug, value);
}
function date(value: string | null, lang: string) {
  return value ? new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";
}
function accessDenied(error: unknown) {
  return !!error && typeof error === "object" && "status" in error && (error.status === 401 || error.status === 403);
}
function ToolName({ slug }: { slug: string }) {
  const { lang, t } = useLang(); const tool = toolNames.get(slug);
  return tool ? <a href={`/${lang}/tool/${encodeURIComponent(tool.slug)}`} target="_blank" rel="noreferrer">{tool.name}</a>
    : <span className="ba-missing"><span>{slug}</span><small>{t("Référence absente du catalogue JSON", "Reference missing from the JSON catalogue")}</small></span>;
}
function AccountSnapshot({ account }: { account: AccountDetail }) {
  const { lang, t } = useLang(); const saved = account.stack;
  if (!saved) return <p>{t("Aucune stack enregistrée.", "No saved stack.")}</p>;
  const { state } = saved;
  return <>
    <p className="ba-meta">{t("Dernière sauvegarde", "Last saved")}: {date(saved.updatedAt, lang)} · {t("Révision", "Revision")} {saved.revision}</p>
    <h3>{t("Sélection enregistrée", "Saved selection")}</h3>
    {state.selection.toolEntries.length === 0 ? <p>{t("La stack enregistrée est vide.", "The saved stack is empty.")}</p> : <ul className="ba-tool-list">{state.selection.toolEntries.map(entry => <li key={entry.toolSlug}>
      <ToolName slug={entry.toolSlug}/><span>{entry.intent === "wishlist" ? t("Envisagé", "Considering") : t("Utilisé", "Using")} · {state.billing.paid.includes(entry.toolSlug) ? t("Payant", "Paid") : state.billing.reviewed.includes(entry.toolSlug) ? t("Gratuit", "Free") : t("Gratuit/payant à préciser", "Free/paid unspecified")}</span>
      {entry.needIds.length > 0 && <small>{entry.needIds.map(id => { const need = state.selection.needs.find(item => item.id === id); return need ? (lang === "en" ? need.labelEn : need.labelFr) : id; }).join(" · ")}</small>}
    </li>)}</ul>}
    <h3>{t("Montants personnels déclarés", "Declared personal amounts")}</h3>
    {Object.keys(state.billing.choices).length === 0 ? <p>{t("Aucun montant personnel déclaré.", "No personal amounts declared.")}</p> : <ul className="ba-tool-list">{Object.entries(state.billing.choices).map(([slug, choice]) => <li key={slug}>
      <ToolName slug={slug}/>{choice.label && <span>{choice.label}</span>}
      <span>{new Intl.NumberFormat(lang === "en" ? "en-GB" : "fr-FR", { maximumFractionDigits: 2 }).format(choice.amount)} {choice.currency} / {choice.period === "annual" ? t("an", "year") : t("mois", "month")}{choice.seats ? ` · ${choice.seats} ${t("sièges", "seats")}` : ""}{choice.perSeat ? ` · ${t("par siège", "per seat")}` : ""}</span>
      <small>{choice.source === "custom" ? t("Montant personnalisé", "Custom amount") : t("Choix de forfait enregistré", "Saved plan choice")}</small>
    </li>)}</ul>}
    <h3>{t("Décisions enregistrées", "Saved decisions")}</h3>
    {Object.keys(state.decisions).length === 0 ? <p>{t("Aucune décision enregistrée.", "No saved decisions.")}</p> : <ul className="ba-tool-list">{Object.entries(state.decisions).map(([key, decision]) => <li key={key}>
      <span>{decision.kind === "keep-both" ? t("Garder les deux", "Keep both") : decision.kind === "replace" ? t("Remplacer", "Replace") : t("Garder un outil", "Keep one")}</span>
      <span>{t("Conservé", "Kept")}: <ToolName slug={decision.kept}/>{decision.removed && <> · {t("Retiré", "Removed")}: <ToolName slug={decision.removed}/></>}</span>
      <small>{t("Économie historique", "Historical saving")}: {decision.saving}{decision.savingCurrency ? ` ${decision.savingCurrency}` : ` · ${t("devise non enregistrée", "currency not recorded")}`} · {date(decision.at, lang)}</small>
    </li>)}</ul>}
    <details className="ba-record"><summary>{t("Toutes les données enregistrées", "All saved data")}</summary><pre>{JSON.stringify(state, null, 2)}</pre></details>
  </>;
}

export function AccountsDashboard() {
  const { lang, t } = useLang(); const searchId = useId();
  const [input, setInput] = useState(""); const [search, setSearch] = useState(""); const [page, setPage] = useState(1); const pageSize = 25;
  const [reload, setReload] = useState(0); const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<"denied" | "unavailable" | null>(null); const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null); const [detail, setDetail] = useState<AccountDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false); const [detailError, setDetailError] = useState(false); const [detailReload, setDetailReload] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setData(null); setError(null); setSelected(null); setDetail(null);
    void loadAccountsDashboard({ search, page, pageSize }).then(value => { if (!cancelled) setData(value); })
      .catch(error => { if (!cancelled) setError(accessDenied(error) ? "denied" : "unavailable"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [search, page, reload]);
  useEffect(() => {
    let cancelled = false; setDetail(null); setDetailError(false);
    if (!selected) { setDetailLoading(false); return; }
    setDetailLoading(true);
    void loadAccountDetail(selected).then(value => { if (!cancelled) setDetail(value); })
      .catch(() => { if (!cancelled) setDetailError(true); })
      .finally(() => { if (!cancelled) setDetailLoading(false); });
    return () => { cancelled = true; };
  }, [selected, detailReload]);
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  return <section className="ba-dashboard" aria-label={t("Comptes et stacks", "Accounts and stacks")}>
    <div className="ba-heading"><div><h2><Users aria-hidden="true"/>{t("Comptes et stacks enregistrées", "Accounts and saved stacks")}</h2><p>{t("Consultation des comptes confirmés et de leurs choix enregistrés.", "Read-only access to confirmed accounts and their saved choices.")}</p></div>
      <button className="ba-button" onClick={() => setReload(value => value + 1)} disabled={loading}><RefreshCw aria-hidden="true"/>{t("Actualiser", "Refresh")}</button></div>
    <form className="ba-search" onSubmit={event => { event.preventDefault(); setPage(1); setSearch(input.trim()); }}>
      <label htmlFor={searchId}>{t("Chercher un compte", "Search accounts")}</label><div><input id={searchId} type="search" value={input} onChange={event => setInput(event.target.value)} placeholder={t("E-mail ou nom", "Email or name")}/><button className="ba-button" type="submit"><Search aria-hidden="true"/>{t("Rechercher", "Search")}</button></div>
    </form>
    {loading && <p role="status">{t("Chargement des comptes…", "Loading accounts…")}</p>}
    {error && <div role="alert" className="ba-error"><p>{error === "denied" ? t("Accès réservé aux administrateurs autorisés. Vérifie le compte connecté.", "Access is restricted to authorized administrators. Check the signed-in account.") : t("Données indisponibles. Les comptes n’ont pas pu être chargés.", "Data unavailable. Accounts could not be loaded.")}</p><button className="ba-button" onClick={() => setReload(value => value + 1)}>{t("Réessayer", "Retry")}</button></div>}
    {data && <>
      <div className="ba-metrics"><div><span>{t("Comptes confirmés", "Confirmed accounts")}</span><strong data-testid="accounts-total">{data.totals.accounts}</strong></div><div><span>{t("Comptes avec stack enregistrée", "Accounts with a saved stack")}</span><strong>{data.totals.accountsWithStack}</strong></div><div><span>{t("Stacks non vides", "Nonempty stacks")}</span><strong>{data.totals.nonemptyStacks}</strong></div></div>
      <p className="ba-meta">{t("Indicateurs globaux, indépendants de la recherche et de la page.", "Global metrics, independent of search and pagination.")} {t("Données actualisées", "Data updated")}: {date(data.updatedAt, lang)}.</p>
      <div className="ba-table-wrap"><table><caption>{t("Comptes enregistrés", "Registered accounts")}</caption><thead><tr><th>{t("Compte", "Account")}</th><th>{t("Création du compte", "Account created")}</th><th>{t("Stack enregistrée", "Saved stack")}</th><th>{t("Dernière sauvegarde", "Last saved")}</th><th>{t("Consultation", "View")}</th></tr></thead><tbody>{data.accounts.map(account => <tr key={account.userId}>
        <td><strong>{account.displayName || account.email || account.userId}</strong>{account.displayName && <small>{account.email || account.userId}</small>}</td><td>{date(account.createdAt, lang)}</td><td>{account.hasStack ? t("Oui", "Yes") : t("Non", "No")}</td><td>{date(account.stackUpdatedAt, lang)}</td>
        <td><button className="ba-button" onClick={() => setSelected(account.userId)} aria-label={`${t("Voir la stack de", "View stack for")} ${account.email || account.userId}`}>{t("Voir", "View")}</button></td></tr>)}</tbody></table></div>
      {data.accounts.length === 0 && <p>{t("Aucun compte trouvé.", "No accounts found.")}</p>}
      <nav className="ba-pagination" aria-label={t("Pagination des comptes", "Account pagination")}><p>{data.total} {t("comptes", "accounts")} · {t("Page", "Page")} {data.page}/{pages}</p><div><button className="ba-button" aria-label={t("Page précédente", "Previous page")} disabled={loading || page <= 1} onClick={() => setPage(value => value - 1)}>{t("Précédente", "Previous")}</button><button className="ba-button" aria-label={t("Page suivante", "Next page")} disabled={loading || page >= pages} onClick={() => setPage(value => value + 1)}>{t("Suivante", "Next")}</button></div></nav>
      {selected && <section className="ba-detail" aria-label={t("Détail du compte", "Account detail")}><div className="ba-heading"><h2>{t("Détail du compte", "Account detail")}</h2><button className="ba-button" onClick={() => setSelected(null)}>{t("Fermer le détail", "Close detail")}</button></div>
        {detailLoading ? <p role="status">{t("Chargement du détail…", "Loading detail…")}</p> : detailError ? <div role="alert"><p>{t("Détail indisponible.", "Detail unavailable.")}</p><button className="ba-button" onClick={() => setDetailReload(value => value + 1)}>{t("Réessayer le détail", "Retry detail")}</button></div> : detail ? <><div className="ac-profile-summary"><AccountAvatar ownerId={detail.userId} label={detail.displayName||detail.email||"?"} avatarUrl={detail.avatarUrl} large/><div>{detail.displayName && <strong>{detail.displayName}</strong>}<p>{detail.email || detail.userId}</p></div></div>{detail.providerLocale&&<p className="ac-note">{t("Langue du fournisseur : ","Provider language: ")}{detail.providerLocale}</p>}{detail.oauthProfileSource&&<p className="ac-note">{t("Fournisseur du profil initial : ","Initial profile provider: ")}{detail.oauthProfileSource==='google'?'Google':'GitHub'}</p>}<p className="ba-meta">{t("Création du compte", "Account created")}: {date(detail.createdAt, lang)}</p><AccountSnapshot account={detail}/></> : <p>{t("Ce compte n’est plus disponible.", "This account is no longer available.")}</p>}
      </section>}
      <section className="ba-ranking"><h2>{t("Outils des stacks enregistrées", "Tools in saved stacks")}</h2><p>{t("Nombre de comptes distincts par outil. Ces chiffres ne mesurent ni achats ni satisfaction.", "Distinct account counts per tool. These figures do not measure purchases or satisfaction.")}</p><div className="ba-table-wrap"><table><thead><tr><th>{t("Outil", "Tool")}</th><th>{t("Utilisé", "Using")}</th><th>{t("Envisagé", "Considering")}</th></tr></thead><tbody>{data.topTools.map(tool => <tr key={tool.toolSlug}><td><ToolName slug={tool.toolSlug}/></td><td>{tool.usedAccounts}</td><td>{tool.wishlistAccounts}</td></tr>)}</tbody></table></div>{data.topTools.length === 0 && <p>{t("Aucun outil enregistré.", "No saved tools.")}</p>}</section>
    </>}
  </section>;
}
