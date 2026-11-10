import listStyles from "@/ds/BackofficePageHeading/BackofficeList.module.css";
import { useEffect, useId, useRef, useState } from "react";
import { useLang } from "@/hooks/useLang";
import BackofficePageHeading from "@/ds/BackofficePageHeading/BackofficePageHeading";
import Button from "@/ds/Button/Button";
import Field from "@/ds/Field/Field";
import { Notice, NoticeText } from "@/ds/Notice/Notice";
import {
  loadAccountDetail,
  loadAccountsDashboard,
  type AccountDetail,
  type AccountsDashboard as DashboardData,
} from "@/lib/backofficeAccountsApi";
import {
  Activity,
  ArrowRight,
  Database,
  ExternalLink,
  FileText,
  Layers3,
  RefreshCw,
  ShieldAlert,
  Users,
} from "@/lib/icons";
import { CatalogDraftSession } from "./catalogDraftSession";
import { CatalogEditor } from "./CatalogEditor";
import { AccountDetailPanel } from "./AccountDetailPanel";
import {
  BackofficeOverview,
  OverviewMetrics,
  ToolsRanking,
} from "./BackofficeOverview";
import { accessDenied, date, tradeLabel } from "./backofficeDisplay";

type View = "overview" | "users" | "stacks" | "usage" | "sources" | "catalog";
export function AccountsDashboard({
  initialView = "users",
  onOpenHistory,
  catalogSession: suppliedSession,
  onCatalogDirtyChange,
  onCatalogReauthenticate,
  section, onSectionNavigate, onAuthorization, accountId, onAccountNavigate, accountHref,
}: {
  accountHref?: (id: string) => string;
  accountId?: string | null;
  onAccountNavigate?: (id: string | null) => void;
  onAuthorization?: (authorized: boolean) => void;
  section?: View;
  onSectionNavigate?: (section: View) => Promise<boolean>;
  catalogSession?: CatalogDraftSession;
  onCatalogReauthenticate?: () => void;
  onCatalogDirtyChange?: (dirty: boolean) => void;
  initialView?: View;
  onOpenHistory?: () => void;
}) {
  const { lang, t } = useLang();
  const searchId = useId();
  const detailRegion = useRef<HTMLElement>(null);
  const [ownSession] = useState(() => new CatalogDraftSession());
  const catalogSession = suppliedSession ?? ownSession;
  const [localView, setView] = useState<View>(() =>
    new URLSearchParams(window.location.search).get("view") === "catalog" ? "catalog" : initialView);
  const view = section ?? localView;
  const [catalogDirty, setCatalogDirty] = useState(false);
  const [navigationError, setNavigationError] = useState(false);
  useEffect(() => {
    onCatalogDirtyChange?.(catalogDirty);
    return () => onCatalogDirtyChange?.(false);
  }, [catalogDirty, onCatalogDirtyChange]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const [reload, setReload] = useState(0);
  const [data, setData] = useState<DashboardData | null>(null);
  const [overview, setOverview] = useState<DashboardData | null>(null);
  const [overviewError, setOverviewError] = useState<
    "denied" | "unavailable" | null
  >(null);
  const [error, setError] = useState<"denied" | "unavailable" | null>(null);
  const [loading, setLoading] = useState(true);
  const [localSelected, setSelected] = useState<string | null>(null);
  const selected = onAccountNavigate ? (view === "users" ? accountId ?? null : null) : localSelected;
  const [detail, setDetail] = useState<AccountDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<
    "denied" | "unavailable" | null
  >(null);
  const [detailReload, setDetailReload] = useState(0);
  const loadedQuery = useRef({ search, page });
  const pendingDetailFocus = useRef(false);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void loadAccountsDashboard({
      search,
      page,
      pageSize,
      includeInsights: true,
    })
      .then((value) => {
        if (!cancelled) {
          loadedQuery.current = { search, page };
          setData(value);
          onAuthorization?.(true);
          if (!search && page === 1) {
            setOverview(value);
            setOverviewError(null);
          }
        }
      })
      .catch((error) => {
        if (!cancelled) {
          const kind = accessDenied(error) ? "denied" : "unavailable";
          if (kind === "denied") { onAuthorization?.(false); setOverview(null); setOverviewError("denied"); }
          if (kind === "denied") setData(null);
          setError(kind);
          if (!search && page === 1) {
            setOverview(null);
            setOverviewError(kind);
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [search, page, reload, onAuthorization]);
  // The overview is always the unfiltered first page, never the last user search.
  useEffect(() => {
    if (view !== "overview" && view !== "stacks") return;
    if (!search && page === 1) return;
    let cancelled = false;
    setOverview(null);
    setOverviewError(null);
    void loadAccountsDashboard({
      search: "",
      page: 1,
      pageSize,
      includeInsights: true,
    })
      .then((value) => {
        if (!cancelled) setOverview(value);
      })
      .catch((error) => {
        if (!cancelled)
          setOverviewError(accessDenied(error) ? "denied" : "unavailable");
      });
    return () => {
      cancelled = true;
    };
  }, [view, search, page, reload]);
  useEffect(() => {
    let cancelled = false;
    setDetail(null);
    setDetailError(null);
    if (!selected) {
      setDetailLoading(false);
      return;
    }
    setDetailLoading(true);
    void loadAccountDetail(selected)
      .then((value) => {
        if (!cancelled) setDetail(value);
      })
      .catch((error) => {
        if (!cancelled)
          setDetailError(accessDenied(error) ? "denied" : "unavailable");
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selected, detailReload]);
  useEffect(() => { pendingDetailFocus.current = Boolean(selected); }, [selected]);
  useEffect(() => {
    if (!selected || detailLoading || view !== "users" || !pendingDetailFocus.current || !detailRegion.current) return;
    pendingDetailFocus.current = false;
    detailRegion.current.scrollIntoView?.({
      block: "start",
      behavior: "instant",
    });
    detailRegion.current.focus({ preventScroll: true });
  }, [selected, detailLoading, view, data]);
  const closeDetail = () => {
    const closing = selected;
    if (onAccountNavigate) onAccountNavigate(null); else setSelected(null);
    requestAnimationFrame(() =>
      (document.getElementById(`${searchId}-${closing}`) ?? document.getElementById(searchId))?.focus(),
    );
  };
  const navigate = async (next: View) => {
    if (onSectionNavigate) { await onSectionNavigate(next); return; }
    if (view === "catalog" && catalogDirty) {
      if (!catalogSession.dirty) { setNavigationError(true); return; }
      try { await catalogSession.flush(); }
      catch { setNavigationError(true); return; }
    }
    const url = new URL(window.location.href);
    url.searchParams.set("view", next);
    if (next !== "catalog") { url.searchParams.delete("tool"); url.searchParams.delete("editor"); }
    window.history.replaceState(window.history.state, "", url);
    setNavigationError(false);
    setView(next);
  };
  const openUser = (id: string) => {
    if (!onAccountNavigate) { if (onSectionNavigate) void onSectionNavigate("users"); else setView("users"); }
    if (id === selected) {
      requestAnimationFrame(() => {
        detailRegion.current?.scrollIntoView?.({ block: "start", behavior: "instant" });
        detailRegion.current?.focus({ preventScroll: true });
      });
      return;
    }
    setDetail(null);
    setDetailError(null);
    setDetailLoading(true);
    if (onAccountNavigate) onAccountNavigate(id); else setSelected(id);
  };
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const listCurrent = loadedQuery.current.search === search && loadedQuery.current.page === page && !error;
  const navigation = [
    {
      id: "overview" as const,
      label: t("Vue d’ensemble", "Overview"),
      icon: Activity,
    },
    { id: "users" as const, label: t("Utilisateurs", "Users"), icon: Users },
    {
      id: "stacks" as const,
      label: t("Stacks & outils", "Stacks & tools"),
      icon: Layers3,
    },
    { id: "catalog" as const, label: t("Fiches", "Records"), icon: FileText },
    {
      id: "usage" as const,
      label: t("Usage du site", "Site usage"),
      icon: ExternalLink,
    },
    {
      id: "sources" as const,
      label: t("Données disponibles", "Available data"),
      icon: Database,
    },
  ];
  const title = {
    overview: t("Vue d’ensemble", "Overview"),
    users: t("Utilisateurs", "Users"),
    stacks: t("Stacks & outils", "Stacks & tools"),
    usage: t("Usage du site", "Site usage"),
    sources: t("Données disponibles", "Available data"),
    catalog: t("Fiches du catalogue", "Catalogue records"),
  }[view];
  const description = {
    catalog: t("Modifiez les fiches et publiez toutes vos modifications ensemble.", "Edit records and publish all your changes together."),
    overview: t(
      "Qui s’inscrit, ce qui est sauvegardé et les outils qui intéressent vos utilisateurs.",
      "Who registers, what gets saved and the tools your users are interested in.",
    ),
    users: t(
      "Retrouvez chaque compte et l’ensemble de ses données sauvegardées.",
      "Explore each account and all its saved data.",
    ),
    stacks: t(
      "Les outils utilisés et envisagés dans les stacks synchronisées.",
      "Tools used and considered in synchronized stacks.",
    ),
    usage: t(
      "Fréquentation, recherches et parcours sur ToolTrim.",
      "Traffic, searches and journeys on ToolTrim.",
    ),
    sources: t(
      "Ce que vous pouvez consulter et les sources qui restent à raccorder.",
      "What you can inspect and the sources still to connect.",
    ),
  }[view];
  const failure = (kind: "denied" | "unavailable", retry: () => void) => (
    <div className="bo-error" role="alert">
      <ShieldAlert size={20} aria-hidden />
      <div>
        <p>
          {kind === "denied"
            ? t(
                "Accès réservé aux administrateurs autorisés. Vérifie le compte connecté.",
                "Access is restricted to authorized administrators. Check the signed-in account.",
              )
            : t(
                "Données indisponibles. Les comptes n’ont pas pu être chargés.",
                "Data unavailable. Accounts could not be loaded.",
              )}
        </p>
        <button
          className="mk-button tt-button-secondary bo-button"
          onClick={retry}
        >
          {t("Réessayer", "Retry")}
        </button>
      </div>
    </div>
  );
  return (
    <section
      className="bo-workspace"
      aria-label={t("Comptes et stacks", "Accounts and stacks")}
    >
      {!onSectionNavigate && <nav
        className="bo-navigation"
        aria-label={t("Navigation du back-office", "Back-office navigation")}
      >
        <div className="mk-segmented bo-navigation-items">
          {navigation.map((item) => (
            <button
              type="button"
              key={item.id}
              aria-current={view === item.id ? "page" : undefined}
              aria-pressed={view === item.id}
              onClick={() => navigate(item.id)}
            >
              <item.icon size={16} aria-hidden />
              {item.label}
            </button>
          ))}
        </div>
        {onOpenHistory && (
          <button
            type="button"
            className="mk-link bo-history"
            onClick={() => { if (catalogDirty) { setNavigationError(true); return; } onOpenHistory(); }}
          >
            <FileText size={16} aria-hidden />
            {t("Diagnostic historique", "Historical diagnostic")}
          </button>
        )}
      </nav>}
      <div className="bo-content">
        {navigationError && <p role="alert">{t("Enregistrez ou abandonnez les modifications de la fiche avant de quitter cet écran.", "Save or discard your record edits before leaving this screen.")}</p>}
        {view !== "catalog" && <BackofficePageHeading title={title} description={description} action={view === "usage" || view === "sources" ? undefined : <Button icon={<RefreshCw size={16} />} onClick={() => { setOverview(null); setReload((value) => value + 1); }} disabled={loading}>{t("Actualiser", "Refresh")}</Button>} />}
        {view === "catalog" && <CatalogEditor onReauthenticate={onCatalogReauthenticate} session={catalogSession} onDirtyChange={setCatalogDirty} />}
        {(view === "overview" || view === "stacks") &&
          (overviewError ? (
            failure(overviewError, () => setReload((value) => value + 1))
          ) : overview ? (
            view === "overview" ? (
              <BackofficeOverview
                data={overview}
                onUser={openUser}
                onUsers={() => navigate("users")}
                onStacks={() => navigate("stacks")}
              />
            ) : (
              <ToolsRanking data={overview} />
            )
          ) : (
            <p className="bo-loading" role="status">
              {t("Chargement des comptes…", "Loading accounts…")}
            </p>
          ))}
        <div hidden={view !== "users"}>
          <form
            className={listStyles.search}
            onSubmit={(event) => {
              event.preventDefault();
              setPage(1);
              setSearch(input.trim());
            }}
          >
            <Field id={searchId} type="search" label={t("Chercher un compte", "Search accounts")} value={input} onChange={(event) => setInput(event.target.value)} placeholder={t("Rechercher par nom ou e-mail…", "Search name or email…")} />
            <Button type="submit" variant="primary">{t("Rechercher", "Search")}</Button>
          </form>
          {loading && (
            <p className="bo-loading" role="status">
              {t("Chargement des comptes…", "Loading accounts…")}
            </p>
          )}
          {view === "users" &&
            error &&
            failure(error, () => setReload((value) => value + 1))}
          {data && (
            <>
              {view === "users" && listCurrent && (
                <OverviewMetrics
                  data={data}
                  onUsers={() => navigate("users")}
                />
              )}
              {listCurrent && <div className="bo-users-heading">
                <p>
                  <strong>{data.total}</strong> {t("comptes", "accounts")}
                  {search && (
                    <>
                      {" "}
                      · {t("résultats pour", "results for")} « {search} »
                    </>
                  )}
                </p>
                <span className="bo-tag">
                  {t("Comptes confirmés actifs", "Active confirmed accounts")}
                </span>
              </div>}
              <div
                className={`bo-users-layout${selected ? " bo-has-detail" : ""}`}
              >
                <div>
                  <div className="bo-table-wrap bo-card bo-user-table">
                    <table className="bo-table">
                      <caption className="bo-sr">
                        {t("Comptes enregistrés", "Registered accounts")}
                      </caption>
                      <thead>
                        <tr>
                          <th>{t("Compte", "Account")}</th>
                          <th>
                            <span className="bo-sr">
                              {t("Consultation", "View")}
                            </span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(listCurrent ? data.accounts : []).map((account) => (
                          <tr
                            key={account.userId}
                            className={
                              selected === account.userId
                                ? "is-selected"
                                : undefined
                            }
                          >
                            <td>
                              <strong>
                                {account.displayName ||
                                  account.email ||
                                  account.userId}
                              </strong>
                              {account.displayName && (
                                <small>{account.email || account.userId}</small>
                              )}
                              <small>
                                {account.insights
                                  ? `${account.insights.usedTools} ${t("utilisés", "using")} · ${account.insights.wishlistTools} ${t("à étudier", "considering")}`
                                  : account.hasStack
                                    ? t("Stack sauvegardée", "Saved stack")
                                    : t("Aucune sauvegarde", "No saved stack")}
                              </small>
                              <small><span>{tradeLabel(account.insights?.trade, lang)}</span> · {t("Inscription", "Registered")}: {date(account.createdAt, lang)} · {t("Dernière sauvegarde", "Last saved")}: {date(account.stackUpdatedAt, lang)}</small>
                            </td>
                            <td>
                              {onAccountNavigate ? <a
                                className="mk-button tt-button-secondary bo-button bo-open-user"
                                id={`${searchId}-${account.userId}`}
                                href={accountHref?.(account.userId) ?? "#"}
                                onClick={(event) => { if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); openUser(account.userId); }}
                                aria-label={`${t("Voir la stack de", "View stack for")} ${account.email || account.userId}`}
                              ><span>{t("Ouvrir", "Open")}</span><ArrowRight size={16} aria-hidden /></a> :                               <button
                                className="mk-button tt-button-secondary bo-button bo-open-user"
                                id={`${searchId}-${account.userId}`}
                                onClick={() => openUser(account.userId)}
                                aria-label={`${t("Voir la stack de", "View stack for")} ${account.email || account.userId}`}
                              >
                                <span>{t("Ouvrir", "Open")}</span>
                                <ArrowRight size={16} aria-hidden />
                              </button>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {listCurrent && data.accounts.length === 0 && (
                    <Notice name="accounts-empty"><NoticeText>{t("Aucun compte trouvé.", "No accounts found.")}</NoticeText></Notice>
                  )}
                  <nav
                    className="bo-pagination"
                    aria-label={t(
                      "Pagination des comptes",
                      "Account pagination",
                    )}
                  >
                    <p>{listCurrent && <>{data.total} {t("comptes", "accounts")} · {t("Page", "Page")} {data.page}/{pages}</>}</p>
                    <div>
                      <button
                        className="mk-button tt-button-secondary bo-button"
                        aria-label={t("Page précédente", "Previous page")}
                        disabled={loading || !listCurrent || page <= 1}
                        onClick={() => setPage((value) => value - 1)}
                      >
                        {t("Précédente", "Previous")}
                      </button>
                      <button
                        className="mk-button tt-button-secondary bo-button"
                        aria-label={t("Page suivante", "Next page")}
                        disabled={loading || !listCurrent || page >= pages}
                        onClick={() => setPage((value) => value + 1)}
                      >
                        {t("Suivante", "Next")}
                      </button>
                    </div>
                  </nav>
                </div>
                {selected && (
                  <section
                    className="bo-detail-slot"
                    ref={detailRegion}
                    tabIndex={-1}
                    aria-label={t("Détail du compte", "Account detail")}
                  >
                    {detailLoading ? (
                      <div className="bo-detail">
                        <p role="status">
                          {t("Chargement du détail…", "Loading detail…")}
                        </p>
                        <button
                          className="mk-button tt-button-secondary bo-button"
                          onClick={closeDetail}
                        >
                          {t("Fermer le détail", "Close detail")}
                        </button>
                      </div>
                    ) : detailError ? (
                      <div className="bo-detail">
                        <div role="alert">
                          <p>
                            {detailError === "denied"
                              ? t(
                                  "Accès refusé. La session administrateur doit être vérifiée.",
                                  "Access denied. Check the administrator session.",
                                )
                              : t(
                                  "Détail indisponible.",
                                  "Detail unavailable.",
                                )}
                          </p>
                          <button
                            className="mk-button tt-button-secondary bo-button"
                            onClick={() =>
                              setDetailReload((value) => value + 1)
                            }
                          >
                            {t("Réessayer le détail", "Retry detail")}
                          </button>
                        </div>
                        <button
                          className="mk-button tt-button-secondary bo-button"
                          onClick={closeDetail}
                        >
                          {t("Fermer le détail", "Close detail")}
                        </button>
                      </div>
                    ) : detail ? (
                      <AccountDetailPanel
                        key={selected}
                        account={detail}
                        onClose={closeDetail}
                      />
                    ) : (
                      <div className="bo-detail">
                        <p>
                          {t(
                            "Ce compte n’est plus disponible.",
                            "This account is no longer available.",
                          )}
                        </p>
                        <button
                          className="mk-button tt-button-secondary bo-button"
                          onClick={closeDetail}
                        >
                          {t("Fermer le détail", "Close detail")}
                        </button>
                      </div>
                    )}
                  </section>
                )}
              </div>
              {listCurrent && <p className="bo-meta bo-source-note">
                {t("Données actualisées", "Data updated")}:{" "}
                {date(data.updatedAt, lang)}.{" "}
                {t(
                  "Les totaux globaux et le classement des outils ne dépendent pas de la recherche ni de la pagination.",
                  "Global totals and tool ranking are independent of search and pagination.",
                )}
              </p>}
            </>
          )}
        </div>
        {view === "usage" && (
          <section className="bo-card bo-source-panel">
            <span className="bo-tag">
              {t("Reporting GA4 non connecté", "GA4 reporting not connected")}
            </span>
            <h2>
              {t(
                "Une vue de la fréquentation reste à raccorder",
                "Traffic reporting still needs connecting",
              )}
            </h2>
            <p>
              {t(
                "Le site émet des pages vues et des événements de recherche, d’exploration et de clics. L’accès aux rapports doit être vérifié pour afficher leurs résultats ici.",
                "The site emits page views and search, exploration and click events. Report access must be verified before displaying their results here.",
              )}
            </p>
            <div className="bo-source-grid">
              {[
                [
                  t("Visites & pages", "Visits & pages"),
                  t(
                    "Fréquentation et contenus consultés",
                    "Traffic and viewed content",
                  ),
                ],
                [
                  t("Recherches & découverte", "Search & discovery"),
                  t(
                    "Recherche d’outils et exploration",
                    "Tool searches and exploration",
                  ),
                ],
                [
                  t("Clics sortants", "Outbound clicks"),
                  t(
                    "Départs vers les sites des outils",
                    "Clicks through to tool websites",
                  ),
                ],
              ].map(([label, text]) => (
                <div key={label}>
                  <h3>{label}</h3>
                  <p>{text}</p>
                  <span className="bo-meta">
                    {t("Données indisponibles ici", "Data unavailable here")}
                  </span>
                </div>
              ))}
            </div>
            <p className="bo-meta">
              {t(
                "Ces statistiques seront agrégées. Une sauvegarde ou une connexion Auth n’est pas une visite mesurée.",
                "These statistics will be aggregated. A save or Auth sign-in is not a measured visit.",
              )}
            </p>
          </section>
        )}
        {view === "sources" && (
          <section className="bo-card bo-source-panel">
            <h2>{t("Vos sources de données", "Your data sources")}</h2>
            <div className="bo-source-list">
              {[
                [
                  t("Comptes & profils", "Accounts & profiles"),
                  t(
                    "Identité, inscription, confirmation, connexion et langue disponibles dans les fiches.",
                    "Identity, registration, confirmation, sign-in and language available in profiles.",
                  ),
                  t("Consultable", "Available"),
                ],
                [
                  t("Sauvegardes Ma Stack", "My Stack snapshots"),
                  t(
                    "Sélections, tableaux, abonnements, usage, métier, TJM et décisions, selon ce qui a été renseigné.",
                    "Selections, boards, subscriptions, usage, trade, daily rate and decisions, where provided.",
                  ),
                  t("Consultable", "Available"),
                ],
                [
                  t("Catalogue & contenus", "Catalogue & content"),
                  t(
                    "Les fiches JSON sont éditables dans l’onglet Fiches. Les brouillons et la publication groupée nécessitent la connexion GitHub du serveur.",
                    "Edit JSON records in the Records tab. Drafts and batch publication require the server GitHub connection.",
                  ),
                  t("Source identifiée", "Source identified"),
                ],
                [
                  t("Demandes & emails", "Requests & emails"),
                  t(
                    "Leads et soumissions proviennent de sources distinctes. Leur regroupement reste à intégrer ; le suivi historique des emails reste dans le diagnostic.",
                    "Leads and submissions come from distinct sources. Their combined view still needs integration; historical email monitoring remains in the diagnostic.",
                  ),
                  t("Intégration à compléter", "Integration pending"),
                ],
                [
                  t("Statistiques du site", "Site statistics"),
                  t(
                    "GA4 : aucun rapport de fréquentation disponible dans ce back-office pour le moment.",
                    "GA4: traffic reports are not available in this workspace yet.",
                  ),
                  t("Non connecté", "Not connected"),
                ],
              ].map(([label, text, status]) => (
                <div key={label}>
                  <div>
                    <h3>{label}</h3>
                    <p>{text}</p>
                  </div>
                  <span className="bo-tag">{status}</span>
                </div>
              ))}
            </div>
            <p className="bo-meta">
              {t(
                "Les sélections non synchronisées, restées dans le navigateur, ne sont pas récupérables ici. Les comptes en attente de confirmation, anonymes ou supprimés sont exclus de la liste actuelle.",
                "Unsynchronized selections stored only in the browser cannot be retrieved here. Unconfirmed, anonymous and deleted accounts are excluded from the current list.",
              )}
            </p>
          </section>
        )}
      </div>
    </section>
  );
}
