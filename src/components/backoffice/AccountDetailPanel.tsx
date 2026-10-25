import { useId, useState } from "react";
import AccountAvatar from "@/components/account/AccountAvatar";
import { useLang } from "@/hooks/useLang";
import type { AccountDetail } from "@/lib/backofficeAccounts";
import { LEGACY_STACK_ENTRY_ADDED_AT } from "@/lib/stackState";
import { ArrowLeft, Check, X } from "@/lib/icons";
import { date, ToolName, tradeLabel } from "./backofficeDisplay";

type Tab = "selection" | "boards" | "budget" | "usage" | "decisions" | "data";
export function AccountDetailPanel({
  account,
  onClose,
}: {
  account: AccountDetail;
  onClose: () => void;
}) {
  const { lang, t } = useLang();
  const id = useId();
  const [tab, setTab] = useState<Tab>("selection");
  const saved = account.stack;
  const state = saved?.state;
  const tabs: { id: Tab; label: string; count?: number }[] = [
    {
      id: "selection",
      label: t("Outils", "Tools"),
      count: state?.selection.toolEntries.length,
    },
    {
      id: "boards",
      label: t("Tableaux", "Boards"),
      count: state?.selection.needs.length,
    },
    {
      id: "budget",
      label: t("Budget déclaré", "Declared budget"),
      count: state && Object.keys(state.billing.choices).length,
    },
    {
      id: "usage",
      label: t("Usage déclaré", "Declared usage"),
      count: state && Object.keys(state.usage).length,
    },
    {
      id: "decisions",
      label: t("Décisions", "Decisions"),
      count: state && Object.keys(state.decisions).length,
    },
    { id: "data", label: t("Données", "Data") },
  ];
  const coverage = state
    ? ([
        [t("Métier", "Trade"), state.trade !== null],
        [t("TJM", "Daily rate"), state.dailyRate !== null],
        [
          t("Montants", "Amounts"),
          Object.keys(state.billing.choices).length > 0,
        ],
        [t("Usage", "Usage"), Object.keys(state.usage).length > 0],
        [t("Décisions", "Decisions"), Object.keys(state.decisions).length > 0],
      ] as const)
    : [];
  return (
    <div className="bo-detail">
      <div className="bo-detail-toolbar">
        <span className="bo-eyebrow">
          {t("Fiche utilisateur", "User profile")}
        </span>
        <button className="bo-button bo-button-quiet" onClick={onClose}>
          <X size={16} aria-hidden />
          {t("Fermer le détail", "Close detail")}
        </button>
      </div>
      <div className="bo-profile">
        <AccountAvatar
          ownerId={account.userId}
          label={account.displayName || account.email || "?"}
          avatarUrl={account.avatarUrl}
          large
        />
        <div>
          <h2>{account.displayName || account.email || account.userId}</h2>
          <p>{account.email || account.userId}</p>
          <span className="bo-tag">{tradeLabel(state?.trade, lang)}</span>
        </div>
      </div>
      <dl className="bo-facts">
        <div>
          <dt>{t("Inscription", "Registered")}</dt>
          <dd>{date(account.createdAt, lang)}</dd>
        </div>
        <div>
          <dt>{t("Dernière connexion Auth", "Last Auth sign-in")}</dt>
          <dd>{date(account.identity?.lastSignInAt, lang)}</dd>
        </div>
        <div>
          <dt>{t("Dernière sauvegarde", "Last saved")}</dt>
          <dd>{date(saved?.updatedAt, lang)}</dd>
        </div>
        <div>
          <dt>{t("TJM déclaré", "Declared daily rate")}</dt>
          <dd>
            {state?.dailyRate
              ? `${new Intl.NumberFormat(lang === "en" ? "en-GB" : "fr-FR").format(state.dailyRate.amount)} ${state.dailyRate.currency} ${t("/ jour", "/ day")}`
              : t("Non renseigné", "Not provided")}
          </dd>
        </div>
        <div>
          <dt>{t("Langue du profil", "Profile language")}</dt>
          <dd>
            {account.identity?.locale || t("Non renseignée", "Not provided")}
          </dd>
        </div>
        <div>
          <dt>{t("E-mail confirmé le", "Email confirmed")}</dt>
          <dd>{date(account.identity?.emailConfirmedAt, lang)}</dd>
        </div>
      </dl>
      {account.providerLocale && (
        <p className="bo-meta">
          {t("Langue du fournisseur : ", "Provider language: ")}
          {account.providerLocale}
        </p>
      )}
      {account.oauthProfileSource && (
        <p className="bo-meta">
          {t("Fournisseur du profil initial : ", "Initial profile provider: ")}
          {account.oauthProfileSource === "google" ? "Google" : "GitHub"}
        </p>
      )}
      <div
        className="bo-coverage"
        aria-label={t("Informations renseignées", "Provided information")}
      >
        {coverage.map(([label, provided]) => (
          <span key={label} className={provided ? "bo-coverage-present" : ""}>
            {provided ? (
              <Check size={13} aria-hidden />
            ) : (
              <span aria-hidden>—</span>
            )}
            {label}
            <span className="bo-sr">
              {" "}
              :{" "}
              {provided
                ? t("renseigné", "provided")
                : t("non renseigné", "not provided")}
            </span>
          </span>
        ))}
      </div>
      {!saved || !state ? (
        <div className="bo-empty">
          {t("Aucune stack enregistrée.", "No saved stack.")}
        </div>
      ) : (
        <>
          <div
            className="bo-tabs"
            role="tablist"
            aria-label={t("Données de l’utilisateur", "User data")}
          >
            {tabs.map((item) => (
              <button
                key={item.id}
                id={`${id}-${item.id}`}
                role="tab"
                type="button"
                aria-selected={tab === item.id}
                aria-controls={`${id}-panel-${item.id}`}
                onClick={() => setTab(item.id)}
                onKeyDown={(event) => {
                  if (
                    !["ArrowLeft", "ArrowRight", "Home", "End"].includes(
                      event.key,
                    )
                  )
                    return;
                  event.preventDefault();
                  const index = tabs.findIndex((value) => value.id === item.id);
                  const next =
                    event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? tabs.length - 1
                        : (index +
                            (event.key === "ArrowRight" ? 1 : -1) +
                            tabs.length) %
                          tabs.length;
                  setTab(tabs[next].id);
                  document.getElementById(`${id}-${tabs[next].id}`)?.focus();
                }}
                tabIndex={tab === item.id ? 0 : -1}
              >
                {item.label}
                {item.count !== undefined && (
                  <span aria-hidden>{item.count}</span>
                )}
              </button>
            ))}
          </div>
          {tabs.map((item) => (
            <div
              key={item.id}
              id={`${id}-panel-${item.id}`}
              role="tabpanel"
              aria-labelledby={`${id}-${item.id}`}
              hidden={tab !== item.id}
              className="bo-tab-panel"
            >
              {item.id === "selection" && (
                <>
                  <h3>{t("Sélection enregistrée", "Saved selection")}</h3>
                  {state.selection.toolEntries.length === 0 ? (
                    <p className="bo-empty">
                      {t(
                        "La stack enregistrée est vide.",
                        "The saved stack is empty.",
                      )}
                    </p>
                  ) : (
                    <ul className="bo-tool-list">
                      {state.selection.toolEntries.map((entry) => (
                        <li key={entry.toolSlug}>
                          <div>
                            <ToolName slug={entry.toolSlug} />
                            <span className="bo-tag">
                              {entry.intent === "wishlist"
                                ? t("À étudier", "Considering")
                                : t("Utilisé", "Using")}
                            </span>
                          </div>
                          <p>
                            {state.billing.paid.includes(entry.toolSlug)
                              ? t(
                                  "Abonnement payant déclaré",
                                  "Declared paid subscription",
                                )
                              : state.billing.reviewed.includes(entry.toolSlug)
                                ? t(
                                    "Version gratuite déclarée",
                                    "Declared free version",
                                  )
                                : t(
                                    "Gratuit/payant à préciser",
                                    "Free/paid unspecified",
                                  )}
                          </p>
                          {entry.needIds.length > 0 && (
                            <small>
                              {entry.needIds
                                .map((needId) => {
                                  const need = state.selection.needs.find(
                                    (value) => value.id === needId,
                                  );
                                  return need
                                    ? lang === "en"
                                      ? need.labelEn
                                      : need.labelFr
                                    : needId;
                                })
                                .join(" · ")}
                            </small>
                          )}
                          {entry.addedAt !== LEGACY_STACK_ENTRY_ADDED_AT && (
                            <small>
                              {t("Ajouté le", "Added")}:{" "}
                              {date(entry.addedAt, lang)}
                            </small>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
              {item.id === "boards" && (
                <>
                  <h3>
                    {t(
                      "Organisation de la sélection",
                      "Selection organization",
                    )}
                  </h3>
                  <p className="bo-meta">
                    {t(
                      "Les tableaux prédéfinis peuvent être présents même sans outil.",
                      "Default boards can be present without any tools.",
                    )}
                  </p>
                  {state.selection.needs.map((need) => {
                    const entries = state.selection.toolEntries.filter(
                      (entry) => entry.needIds.includes(need.id),
                    );
                    return (
                      <section className="bo-board" key={need.id}>
                        <h4>
                          {lang === "en" ? need.labelEn : need.labelFr}
                          <span>{entries.length}</span>
                        </h4>
                        {entries.length ? (
                          <ul>
                            {entries.map((entry) => (
                              <li key={entry.toolSlug}>
                                <ToolName slug={entry.toolSlug} />
                                <small>
                                  {entry.intent === "wishlist"
                                    ? t("À étudier", "Considering")
                                    : t("Utilisé", "Using")}
                                </small>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="bo-meta">
                            {t(
                              "Aucun outil classé ici.",
                              "No tools assigned here.",
                            )}
                          </p>
                        )}
                      </section>
                    );
                  })}
                  {state.selection.toolEntries.some(
                    (entry) => !entry.needIds.length,
                  ) && (
                    <section className="bo-board">
                      <h4>{t("Sans tableau", "Unassigned")}</h4>
                      <ul>
                        {state.selection.toolEntries
                          .filter((entry) => !entry.needIds.length)
                          .map((entry) => (
                            <li key={entry.toolSlug}>
                              <ToolName slug={entry.toolSlug} />
                            </li>
                          ))}
                      </ul>
                    </section>
                  )}
                </>
              )}
              {item.id === "budget" && (
                <>
                  <h3>
                    {t(
                      "Montants personnels déclarés",
                      "Declared personal amounts",
                    )}
                  </h3>
                  <p className="bo-meta">
                    {t(
                      "Déclarations de l’utilisateur, sans vérification de paiement. Les montants gardent leur devise et leur période.",
                      "User declarations, without payment verification. Amounts retain their currency and period.",
                    )}
                  </p>
                  {Object.keys(state.billing.choices).length === 0 ? (
                    <p className="bo-empty">
                      {t(
                        "Aucun montant personnel déclaré.",
                        "No personal amounts declared.",
                      )}
                    </p>
                  ) : (
                    <ul className="bo-tool-list">
                      {Object.entries(state.billing.choices).map(
                        ([slug, choice]) => (
                          <li key={slug}>
                            <ToolName slug={slug} />
                            {choice.label && <span>{choice.label}</span>}
                            <span className="bo-amount">
                              {new Intl.NumberFormat(
                                lang === "en" ? "en-GB" : "fr-FR",
                                { maximumFractionDigits: 2 },
                              ).format(choice.amount)}{" "}
                              {choice.currency} /{" "}
                              {choice.period === "annual"
                                ? t("an", "year")
                                : t("mois", "month")}
                              {choice.seats
                                ? ` · ${choice.seats} ${t("sièges", "seats")}`
                                : ""}
                              {choice.perSeat
                                ? ` · ${t("par siège", "per seat")}`
                                : ""}
                            </span>
                            <small>
                              {choice.source === "custom"
                                ? t("Montant personnalisé", "Custom amount")
                                : t(
                                    "Choix de forfait enregistré",
                                    "Saved plan choice",
                                  )}
                            </small>
                          </li>
                        ),
                      )}
                    </ul>
                  )}
                  {state.billing.paid
                    .filter((slug) => !state.billing.choices[slug])
                    .map((slug) => (
                      <p className="bo-unpriced" key={slug}>
                        <ToolName slug={slug} />
                        <span>
                          {t(
                            "Payant déclaré · montant non renseigné",
                            "Declared paid · amount not provided",
                          )}
                        </span>
                      </p>
                    ))}
                </>
              )}
              {item.id === "usage" && (
                <>
                  <h3>{t("Usage déclaré", "Declared usage")}</h3>
                  <p className="bo-meta">
                    {t(
                      "Intensité renseignée sur une échelle de 1 à 5. Ce n’est pas une mesure automatique du temps passé.",
                      "Self-reported intensity on a scale from 1 to 5. This is not automatically measured time.",
                    )}
                  </p>
                  {Object.keys(state.usage).length === 0 ? (
                    <p className="bo-empty">
                      {t("Aucun usage renseigné.", "No usage provided.")}
                    </p>
                  ) : (
                    <ul className="bo-tool-list">
                      {Object.entries(state.usage).map(([slug, level]) => (
                        <li key={slug}>
                          <div>
                            <ToolName slug={slug} />
                            <strong>{level} / 5</strong>
                          </div>
                          <div className="bo-usage-track" aria-hidden>
                            {[1, 2, 3, 4, 5].map((value) => (
                              <i
                                key={value}
                                className={
                                  value <= level ? "is-filled" : undefined
                                }
                              />
                            ))}
                          </div>
                          <span>
                            {
                              [
                                t("Usage faible", "Low use"),
                                t("Usage occasionnel", "Occasional use"),
                                t("Usage régulier", "Regular use"),
                                t("Usage soutenu", "Frequent use"),
                                t("Usage intensif", "Intensive use"),
                              ][level - 1]
                            }
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
              {item.id === "decisions" && (
                <>
                  <h3>{t("Décisions enregistrées", "Saved decisions")}</h3>
                  {Object.keys(state.decisions).length === 0 ? (
                    <p className="bo-empty">
                      {t("Aucune décision enregistrée.", "No saved decisions.")}
                    </p>
                  ) : (
                    <ul className="bo-tool-list">
                      {Object.entries(state.decisions).map(
                        ([key, decision]) => (
                          <li key={key}>
                            <strong>
                              {decision.kind === "keep-both"
                                ? t("Garder les deux", "Keep both")
                                : decision.kind === "replace"
                                  ? t("Remplacer", "Replace")
                                  : t("Garder un outil", "Keep one")}
                            </strong>
                            <span>
                              {t("Conservé", "Kept")}:{" "}
                              <ToolName slug={decision.kept} />
                              {decision.removed && (
                                <>
                                  {" "}
                                  · {t("Retiré", "Removed")}:{" "}
                                  <ToolName slug={decision.removed} />
                                </>
                              )}
                            </span>
                            <small>
                              {t("Économie historique", "Historical saving")}:{" "}
                              {decision.saving}
                              {decision.savingCurrency
                                ? ` ${decision.savingCurrency}`
                                : ` · ${t("devise non enregistrée", "currency not recorded")}`}{" "}
                              · {date(decision.at, lang)}
                            </small>
                          </li>
                        ),
                      )}
                    </ul>
                  )}
                </>
              )}
              {item.id === "data" && (
                <>
                  <h3>{t("Provenance des données", "Data provenance")}</h3>
                  <dl className="bo-facts">
                    <div>
                      <dt>
                        {t("Identifiant du compte", "Account identifier")}
                      </dt>
                      <dd>{account.userId}</dd>
                    </div>
                    <div>
                      <dt>{t("Révision du snapshot", "Snapshot revision")}</dt>
                      <dd>{saved.revision}</dd>
                    </div>
                  </dl>
                  <p className="bo-meta">
                    {t(
                      "État sauvegardé actuel. Les données restées uniquement dans le navigateur et l’historique complet des visites ne sont pas disponibles ici.",
                      "Current saved state. Browser-only data and complete visit history are not available here.",
                    )}
                  </p>
                  <details className="bo-record">
                    <summary>
                      {t("Toutes les données enregistrées", "All saved data")}
                    </summary>
                    <pre>{JSON.stringify(state, null, 2)}</pre>
                  </details>
                </>
              )}
            </div>
          ))}
          <p className="bo-meta bo-detail-footer">
            {t("Dernière sauvegarde", "Last saved")}:{" "}
            {date(saved.updatedAt, lang)} · {t("Révision", "Revision")}{" "}
            {saved.revision}
          </p>
        </>
      )}
      <button className="bo-button bo-back" onClick={onClose}>
        <ArrowLeft size={16} aria-hidden />
        {t("Revenir à la liste", "Back to users")}
      </button>
    </div>
  );
}
