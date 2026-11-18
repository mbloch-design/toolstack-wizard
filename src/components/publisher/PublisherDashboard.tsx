import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import Button, { buttonAttrs, linkClass } from "@/ds/Button/Button";
import Field, { SelectField } from "@/ds/Field/Field";
import Page from "@/ds/Page/Page";
import { useLang } from "@/hooks/useLang";
import { clearPublisherInvitation, PublisherApiError, publisherPath, publisherRequest, readPublisherInvitation, type ListingCandidate, type ListingOffer, type ListingRequest, type PublisherClaim, type PublisherToken, type PublisherTool } from "@/lib/publisherCatalogApi";
import { listingCommercialLabel, listingOfferLabel } from "@/lib/listingOfferPresentation";
import ListingStatusCard, { listingStatus } from "./ListingStatusCard";
import styles from "./PublisherWorkspace.module.css";

const endpoint = "/api/listing-requests";

export default function PublisherDashboard({ getToken }: { getToken: PublisherToken }) {
  const { lang, prefix, t } = useLang();
  const { hash } = useLocation();
  const [query, setQuery] = useSearchParams();
  const listingId = query.get("listingId");
  const [tools, setTools] = useState<PublisherTool[] | null>(null);
  const [listings, setListings] = useState<ListingRequest[] | null>(null);
  const [claims, setClaims] = useState<PublisherClaim[]>([]);
  const [toolFilter, setToolFilter] = useState("");
  const [name, setName] = useState(() => query.get("tool")?.slice(0, 120) ?? "");
  const [websiteUrl, setWebsite] = useState(() => query.get("site")?.slice(0, 2048) ?? "");
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
  const [loadErrors, setLoadErrors] = useState({ tools: false, listings: false });
  const invitationField = useRef<HTMLInputElement>(null);
  const proposalHeading = useRef<HTMLHeadingElement>(null);
  const listingsLoaded = listings !== null;

  useEffect(() => {
    active.current = true;
    setLoadErrors({ tools: false, listings: false });
    const controller = new AbortController();
    const options = { signal: controller.signal };
    void publisherRequest<{ tools: PublisherTool[] }>(getToken, "/api/publisher-catalog", options).then(
      (result) => { if (!controller.signal.aborted) setTools(result.tools); },
      () => { if (!controller.signal.aborted) { setTools(null); setLoadErrors((state) => ({ ...state, tools: true })); } },
    );
    void publisherRequest<{ listings: ListingRequest[]; claims?: PublisherClaim[] }>(getToken, endpoint, options).then(
      (result) => { if (!controller.signal.aborted) {
        setListings(result.listings);
        setClaims((result.claims ?? []).filter((claim) => claim.status === "pending"));
      } },
      () => { if (!controller.signal.aborted) { setListings(null); setLoadErrors((state) => ({ ...state, listings: true })); } },
    );
    return () => { active.current = false; controller.abort(); };
  }, [getToken, reload]);

  useEffect(() => {
    if (!listingsLoaded) return;
    if (query.has("invite")) invitationField.current?.focus();
    else if (hash === "#publisher-new") proposalHeading.current?.focus();
  }, [hash, listingsLoaded, query]);

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
      const invitationErrors: Record<string, string> = {
        LISTING_INVITATION_ACCOUNT_MISMATCH: t("Cette invitation est liée à un autre compte. Connectez-vous avec l’adresse à laquelle elle a été envoyée.", "This invitation is linked to another account. Sign in with the email address it was sent to."),
        LISTING_INVITATION_EXPIRED: t("Cette invitation a expiré. Demandez un nouveau lien à ToolTrim.", "This invitation has expired. Ask ToolTrim for a new link."),
        LISTING_INVITATION_REVOKED: t("Cette invitation a été retirée. Contactez ToolTrim pour vérifier votre accès.", "This invitation was revoked. Contact ToolTrim to check your access."),
        LISTING_INVITATION_USED: t("Cette invitation a déjà été acceptée. Retrouvez votre accès dans Mes fiches.", "This invitation has already been accepted. Find your access in My listings."),
      };
      setError(cause instanceof PublisherApiError && invitationErrors[cause.code]
        ? invitationErrors[cause.code]
        : cause instanceof PublisherApiError && cause.status === 409
          ? t("Le dossier a changé. Vérifiez son état avant de réessayer.", "The application has changed. Check its status before trying again.")
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
  const selectedTool = selected?.toolId && tools?.find((tool) => tool.id === selected.toolId);
  const toolIdsWithApplication = new Set(listings?.map((item) => item.toolId));
  const standaloneTools = tools?.filter((tool) => !toolIdsWithApplication.has(tool.id));
  const filter = toolFilter.toLowerCase().trim();
  const shownTools = standaloneTools?.filter((tool) => tool.name.toLowerCase().includes(filter));
  const shownListings = listings?.filter((listing) => listing.name.toLowerCase().includes(filter));
  const shownClaims = claims.filter((claim) => claim.slug.toLowerCase().includes(filter));
  return <Page>
    {(loadErrors.tools || loadErrors.listings) && <div role="alert" className={styles.section}>
      <p>{t("Une partie de vos fiches n’a pas pu être chargée. Les informations disponibles restent consultables.", "Some of your listings could not be loaded. Available information remains accessible.")}</p>
      <div className={styles.actions}><Button onClick={() => setReload((value) => value + 1)}>{t("Réessayer", "Try again")}</Button></div>
    </div>}
    {listingId && <>
      <Link className={linkClass()} to={publisherPath(prefix)}>{t("Retour à mes fiches", "Back to my listings")}</Link>
      {selected ? <ListingStatusCard key={selected.id} listing={selected} toolSlug={selectedTool ? selectedTool.slug : undefined} getToken={getToken} update={updateListing}
        returnedFromPayment={query.get("payment") === "return"}
        clearPaymentReturn={() => setQuery({ listingId: selected.id }, { replace: true })} />
        : <p role="status">{listings ? t("Ce dossier n’est pas accessible depuis votre compte.", "Your account cannot access this application.") : loadErrors.listings ? t("Dossier indisponible. Réessayez le chargement.", "Application unavailable. Retry loading.") : t("Recherche du dossier…", "Finding your application…")}</p>}
    </>}
    {!listingId && <>
      <div className={styles.actions}>
        <a {...buttonAttrs("primary")} href="#publisher-new">{t("Ajouter un produit", "Add a product")}</a>
      </div>
      {!!notice && <p role="status">{notice}</p>}
      {!!error && <p role="alert" className={styles.error}>{error}</p>}
      <section className={styles.section} aria-label={t("Fiches et demandes", "Listings and applications")}>
        {(standaloneTools?.length ?? 0) + (listings?.length ?? 0) + claims.length > 1 &&
          <Field type="search" label={t("Rechercher parmi mes fiches", "Search my listings")} value={toolFilter} onChange={(event) => setToolFilter(event.target.value)} />}
        {listings && tools && !shownTools?.length && !shownListings?.length && !shownClaims.length && <p>{filter
          ? t("Aucune fiche ne correspond à cette recherche.", "No listings match this search.")
          : t("Vous n’avez pas encore de fiche. Vous pouvez proposer un outil ci-dessous.", "You have no listings yet. You can suggest a tool below.")}</p>}
        {((listings === null && !loadErrors.listings) || (tools === null && !loadErrors.tools)) && <p role="status">{t("Chargement de vos fiches et de vos demandes…", "Loading your listings and applications…")}</p>}
        {(!!shownTools?.length || !!shownListings?.length || !!shownClaims.length) && <div className={styles.cards}>
          {shownListings?.map((listing) => {
            const published = listing.deliveryStatus === "published";
            const tool = published || listing.deliveryStatus === "offline" ? tools?.find((item) => item.id === listing.toolId) : undefined;
            return <article className={styles.card} key={listing.id}>
              <h3>{listing.name}</h3>
              <p>{listingOfferLabel(listing.offer, t)}</p>
              <p className={styles.muted}>{listingCommercialLabel(listing.offer, listing.commercialStatus, t)} · {published ? t("En ligne", "Live") : listingStatus(listing.status, t)}</p>
              <div className={styles.actions}>
                {tool && <Link {...buttonAttrs()} to={publisherPath(prefix, tool.slug)}>{tool.canEdit ? t("Modifier la fiche", "Edit listing") : t("Consulter la fiche", "View listing")}</Link>}
                <Link {...buttonAttrs()} to={`?listingId=${encodeURIComponent(listing.id)}`}>{published ? t("Voir le suivi", "View progress") : t("Ouvrir le dossier", "Open application")}</Link>
              </div>
            </article>;
          })}
          {shownTools?.map((tool) => <article className={styles.card} key={tool.id}>
            <h3>{tool.name}</h3>
            <Link {...buttonAttrs()} to={publisherPath(prefix, tool.slug)}>{tool.canEdit ? t("Modifier la fiche", "Edit listing") : t("Consulter la fiche", "View listing")}</Link>
          </article>)}
          {shownClaims.map((claim) => <article className={styles.card} key={claim.toolId}>
            <h3>{claim.slug}</h3><p>{t("Demande d’accès en attente de vérification", "Access request awaiting verification")}</p>
          </article>)}
        </div>}
      </section>

      {listings && <section className={styles.section} aria-labelledby="publisher-new">
        <h2 id="publisher-new" ref={proposalHeading} tabIndex={-1}>{t("Proposer ou retrouver un outil", "Suggest or find a tool")}</h2>
        <p>{t("Un dossier par produit. Retrouvez ensuite son offre, son paiement et sa publication au même endroit.", "One application per product. Track its offer, payment and publication in one place.")}</p>
        <p>{listingOfferLabel(offer, t)}</p>
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
              <option value="standard_badge">{listingOfferLabel("standard_badge", t)}</option>
              <option value="priority_paid">{listingOfferLabel("priority_paid", t)}</option>
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
            setNotice(t("Invitation acceptée. Retrouvez la fiche et vos droits dans Mes fiches.", "Invitation accepted. Find the listing and your access in My listings."));
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
