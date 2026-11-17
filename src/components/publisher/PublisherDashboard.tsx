import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Button, { buttonAttrs, linkClass } from "@/ds/Button/Button";
import Field, { SelectField } from "@/ds/Field/Field";
import Page from "@/ds/Page/Page";
import { useLang } from "@/hooks/useLang";
import { clearPublisherInvitation, PublisherApiError, publisherPath, publisherRequest, readPublisherInvitation, type ListingCandidate, type ListingOffer, type ListingRequest, type PublisherToken, type PublisherTool } from "@/lib/publisherCatalogApi";
import ListingStatusCard, { listingStatus } from "./ListingStatusCard";
import styles from "./PublisherWorkspace.module.css";

type Claim = { toolId: string; slug: string; status: "pending" };
const endpoint = "/api/listing-requests";

export default function PublisherDashboard({ getToken }: { getToken: PublisherToken }) {
  const { lang, prefix, t } = useLang();
  const [query, setQuery] = useSearchParams();
  const listingId = query.get("listingId");
  const [tools, setTools] = useState<PublisherTool[] | null>(null);
  const [listings, setListings] = useState<ListingRequest[] | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [toolFilter, setToolFilter] = useState("");
  const [name, setName] = useState("");
  const [websiteUrl, setWebsite] = useState("");
  const [offer, setOffer] = useState<ListingOffer>(query.get("offer") === "priority_paid" ? "priority_paid" : "standard_badge");
  const [invitation, setInvitation] = useState(() => query.get("invite") === "continue" ? readPublisherInvitation() : "");
  const [candidates, setCandidates] = useState<ListingCandidate[] | null>(null);
  const createKey = useRef<string | null>(null);
  const [busy, setBusy] = useState(false);
  const active = useRef(false);
  const pending = useRef(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reload, setReload] = useState(0);
  const invitationField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    active.current = true;
    const controller = new AbortController();
    const options = { signal: controller.signal };
    void publisherRequest<{ tools: PublisherTool[] }>(getToken, "/api/publisher-catalog", options).then(
      (result) => { if (!controller.signal.aborted) setTools(result.tools); },
      () => { if (!controller.signal.aborted) setTools(null); },
    );
    void publisherRequest<{ listings: ListingRequest[]; claims?: Claim[] }>(getToken, endpoint, options).then(
      (result) => { if (!controller.signal.aborted) { setListings(result.listings); setClaims(result.claims ?? []); } },
      () => { if (!controller.signal.aborted) setListings(null); },
    );
    return () => { active.current = false; controller.abort(); };
  }, [getToken, reload]);

  useEffect(() => {
    if (listings && query.has("invite")) invitationField.current?.focus();
  }, [listings, query]);

  function resetLookup() {
    setCandidates(null);
    createKey.current = null;
    setError("");
  }

  async function act<T>(body: object, complete: (result: T) => void) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setNotice("");
    setError("");
    try {
      const result = await publisherRequest<T>(getToken, endpoint, { method: "POST", body });
      if (active.current) complete(result);
    } catch (cause) {
      if (!active.current) return;
      setError(cause instanceof PublisherApiError && cause.status === 409
        ? t("Le dossier ou le lien d’invitation a changé. Vérifiez son état avant de réessayer.", "The application or invitation has changed. Check its status before trying again.")
        : t("La demande n’a pas abouti. Vérifiez les informations saisies, puis réessayez.", "The request could not be completed. Check the information you entered, then try again."));
    } finally {
      pending.current = false;
      if (active.current) setBusy(false);
    }
  }

  function lookup(event: FormEvent) {
    event.preventDefault();
    void act<{ candidates: ListingCandidate[] }>({ action: "lookup", name: name.trim(), websiteUrl: websiteUrl.trim() }, ({ candidates }) => setCandidates(candidates));
  }

  function updateListing(listing: ListingRequest) {
    setListings((current) => [listing, ...(current ?? []).filter((item) => item.id !== listing.id)]);
  }

  function openListing(id: string) {
    setQuery({ listingId: id });
  }

  function create() {
    createKey.current ??= crypto.randomUUID();
    void act<{ listing: ListingRequest }>({
      action: "create", name: name.trim(), websiteUrl: websiteUrl.trim(), offer, locale: lang, idempotencyKey: createKey.current,
    }, ({ listing }) => {
      updateListing(listing);
      setName("");
      setWebsite("");
      resetLookup();
      openListing(listing.id);
    });
  }

  const selected = listings?.find((item) => item.id === listingId);
  const shownTools = tools?.filter((tool) => tool.name.toLowerCase().includes(toolFilter.toLowerCase().trim()));
  return <Page>
    {listingId && <>
      <Link className={linkClass()} to={publisherPath(prefix)}>{t("Toutes mes fiches", "All my listings")}</Link>
      {selected ? <ListingStatusCard key={selected.id} listing={selected} getToken={getToken} update={updateListing}
        returnedFromPayment={query.get("payment") === "return"}
        clearPaymentReturn={() => setQuery({ listingId: selected.id }, { replace: true })} />
        : <p role="status">{listings ? t("Ce dossier n’est pas accessible depuis votre compte.", "Your account cannot access this application.") : t("Recherche du dossier…", "Finding your application…")}</p>}
    </>}
    {!listingId && <>
      {!!notice && <p role="status">{notice}</p>}
      {!!error && <p role="alert" className={styles.error}>{error}</p>}
      <section className={styles.section} aria-labelledby="publisher-assigned">
        <h2 id="publisher-assigned">{t("Fiches rattachées", "Assigned listings")}</h2>
        {tools && !tools.length && <p>{t("Votre compte n’est pas encore rattaché à un outil.", "Your account is not yet linked to a tool.")}</p>}
        {tools && tools.length > 1 && <Field type="search" label={t("Rechercher parmi mes fiches", "Search my listings")} value={toolFilter} onChange={(event) => setToolFilter(event.target.value)} />}
        {shownTools && shownTools.length > 0 && <div className={styles.cards}>{shownTools.map((tool) => <article className={styles.card} key={tool.id}>
          <h3>{tool.name}</h3>
          <Link {...buttonAttrs()} to={publisherPath(prefix, tool.slug)}>{tool.canEdit ? t("Modifier la fiche", "Edit listing") : t("Consulter la fiche", "View listing")}</Link>
        </article>)}</div>}
        {tools?.length && !shownTools?.length ? <p>{t("Aucune fiche ne correspond à cette recherche.", "No listings match this search.")}</p> : null}
        {tools === null && <p role="status">{t("Les fiches rattachées sont en cours de chargement ou temporairement indisponibles.", "Assigned listings are loading or temporarily unavailable.")}</p>}
      </section>

      <section className={styles.section} aria-labelledby="publisher-listings">
        <h2 id="publisher-listings">{t("Mes demandes", "My applications")}</h2>
        {listings && !listings.length && !claims.length && <p>{t("Vous n’avez pas encore de demande.", "You have no applications yet.")}</p>}
        {listings === null && <p role="status">{t("Les demandes sont en cours de chargement ou temporairement indisponibles.", "Applications are loading or temporarily unavailable.")}</p>}
        {(!!listings?.length || !!claims.length) && <div className={styles.cards}>
          {listings?.map((listing) => <article className={styles.card} key={listing.id}>
            <h3>{listing.name}</h3>
            <p>{listingStatus(listing.status, t)}</p>
            <Link {...buttonAttrs()} to={`?listingId=${encodeURIComponent(listing.id)}`}>{t("Ouvrir le dossier", "Open application")}</Link>
          </article>)}
          {claims.map((claim) => <article className={styles.card} key={claim.toolId}>
            <h3>{claim.slug}</h3><p>{t("Demande d’accès en attente de vérification", "Access request awaiting verification")}</p>
          </article>)}
        </div>}
      </section>

      {listings && <section className={styles.section} aria-labelledby="publisher-new">
        <h2 id="publisher-new">{t("Proposer ou retrouver un outil", "Suggest or find a tool")}</h2>
        <form onSubmit={lookup}>
          <Field label={t("Nom de l’outil", "Tool name")} value={name} required maxLength={120} disabled={busy}
            onChange={(event) => { setName(event.target.value); resetLookup(); }} />
          <Field label={t("Site officiel", "Official website")} type="url" placeholder="https://" value={websiteUrl} required disabled={busy}
            onChange={(event) => { setWebsite(event.target.value); resetLookup(); }} />
          <div className={styles.actions}><Button variant={candidates ? "secondary" : "primary"} type="submit" disabled={busy}>
            {busy ? t("Vérification…", "Checking…") : t("Chercher dans ToolTrim", "Search ToolTrim")}
          </Button></div>
        </form>
        {candidates && <>
          {candidates.length ? <div className={styles.cards}>{candidates.map((candidate) => <article key={candidate.id} className={styles.card}>
            <h3>{candidate.name}</h3>
            <p>{candidate.websiteUrl}</p>
            {candidate.kind === "listing"
              ? <Button onClick={() => openListing(candidate.id)}>{t("Reprendre le dossier", "Resume application")}</Button>
              : claims.some((claim) => claim.toolId === candidate.id)
                ? <p>{t("Demande d’accès en attente", "Access request pending")}</p>
                : <Button disabled={busy} onClick={() => void act<{ claim: { toolId: string; status: "pending" } }>({ action: "claimExisting", toolId: candidate.id }, ({ claim }) => {
                  setClaims((current) => [...current.filter((item) => item.toolId !== claim.toolId), { ...claim, slug: candidate.slug }]);
                  setNotice(t("Demande d’accès enregistrée. ToolTrim vérifiera que vous représentez cet outil.", "Access request recorded. ToolTrim will verify that you represent this tool."));
                })}>{t("Demander l’accès à cette fiche", "Request access to this listing")}</Button>}
          </article>)}</div> : <>
            <p>{t("Aucune fiche correspondante trouvée. Vous pouvez ouvrir un dossier.", "No matching listing was found. You can open an application.")}</p>
            <SelectField label={t("Offre", "Offer")} value={offer} disabled={busy} onChange={(event) => {
              setOffer(event.target.value as ListingOffer);
              createKey.current = null;
            }}>
              <option value="standard_badge">{t("Revue standard · 0 $ avec badge", "Standard review · $0 with a badge")}</option>
              <option value="priority_paid">{t("Fiche prioritaire · 29 $ une fois, sans badge", "Priority listing · $29 once, no badge")}</option>
            </SelectField>
            <div className={styles.actions}><Button variant="primary" disabled={busy} onClick={create}>{t("Créer le dossier", "Create application")}</Button></div>
            <p className={styles.muted}>{t("Vous avez déjà payé ? Ouvrez un dossier prioritaire, puis utilisez « J’ai déjà payé » pour le rapprocher de votre reçu.", "Already paid? Open a priority application, then choose “I’ve already paid” to match it to your receipt.")}</p>
          </>}
        </>}
      </section>}
      {listings && <section className={styles.section} aria-labelledby="publisher-invite">
        <h2 id="publisher-invite">{t("Accepter une invitation", "Accept an invitation")}</h2>
        {query.get("invite") === "manual" && <p>{t("Saisissez le code reçu pour accepter l’invitation.", "Enter the code you received to accept the invitation.")}</p>}
        <form onSubmit={(event) => {
          event.preventDefault();
          void act({ action: "acceptInvitation", token: invitation.trim() }, () => {
            clearPublisherInvitation();
            setInvitation("");
            if (query.has("invite")) setQuery({}, { replace: true });
            setReload((current) => current + 1);
            setNotice(t("Invitation acceptée. Actualisation de vos fiches…", "Invitation accepted. Refreshing your listings…"));
          });
        }}>
          <Field inputRef={invitationField} label={t("Code d’invitation", "Invitation code")} type="password" autoComplete="off" value={invitation}
            maxLength={43} minLength={43} pattern="[A-Za-z0-9_\\-]{43}" disabled={busy}
            onChange={(event) => setInvitation(event.target.value)} required />
          <div className={styles.actions}>
            <Button type="submit" disabled={busy}>{t("Accepter l’invitation", "Accept invitation")}</Button>
          </div>
        </form>
      </section>}
    </>}
    {(tools === null || listings === null) && <div className={styles.actions}><Button onClick={() => setReload(reload + 1)}>{t("Actualiser mes fiches", "Refresh my listings")}</Button></div>}
  </Page>;
}
