import { useEffect, useState } from "react";
import { useLang } from "@/hooks/useLang";
import { supabase } from "@/integrations/supabase/client";
import Button from "@/ds/Button/Button";
import Field, { SelectField } from "@/ds/Field/Field";
import { Notice } from "@/ds/Notice/Notice";
import BackofficePageHeading from "@/ds/BackofficePageHeading/BackofficePageHeading";
import InitialListingAdminReview from "./InitialListingAdminReview";
import styles from "./ContributionQueue.module.css";

type Claim = { ownerId: string; toolId: string; slug: string; confirmedEmail: string; createdAt: string };
type Invitation = { id: string; toolId: string; expiresAt: string; status: "pending" | "accepted" | "revoked" | "expired" };
type Directory = {
  claims: Claim[];
  listings: { id: string; name: string; websiteUrl: string; confirmedEmail: string }[];
  brands: { id: string; name: string; websiteDomain: string }[];
  invitations: Invitation[];
};

async function listingRequest(body?: Record<string, string>) {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error("SESSION_REQUIRED");
  const response = await fetch("/api/backoffice-listings", {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: "Bearer " + data.session.access_token,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) throw new Error(String(response.status));
  return response.json();
}

export function ListingAdmin({ onBack }: { onBack: () => void }) {
  const { t, lang, prefix } = useLang();
  const [directory, setDirectory] = useState<Directory>();
  const [listingId, setListingId] = useState<string>();
  const [claim, setClaim] = useState<Claim>();
  const [brandId, setBrandId] = useState("");
  const [brandName, setBrandName] = useState("");
  const [brandDomain, setBrandDomain] = useState("");
  const [role, setRole] = useState("owner");
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [revision, reload] = useState(0);

  useEffect(() => {
    let active = true;
    void listingRequest().then((result) => {
      if (!active) return;
      if (!Array.isArray(result.claims) || !Array.isArray(result.listings)
        || !Array.isArray(result.brands) || !Array.isArray(result.invitations)) throw new Error("INVALID_LISTINGS");
      setDirectory(result);
    }).catch(() => {
      if (active) setError(t("Impossible de charger les demandes.", "Could not load requests."));
    });
    return () => { active = false; };
  }, [revision, t]);

  async function invite() {
    if (!claim || busy || (!brandId && (!brandName.trim() || !brandDomain.trim()))) return;
    setBusy(true);
    setError("");
    try {
      const result = await listingRequest({
        action: "invite", ownerId: claim.ownerId, toolId: claim.toolId, role: brandId ? role : "owner",
        ...(brandId ? { brandId } : { brandName: brandName.trim(), brandDomain: brandDomain.trim() }),
      });
      const token = result.invitation?.token;
      if (typeof token !== "string" || !/^[\w-]{43}$/.test(token)) throw new Error("INVALID_INVITATION");
      setLink(new URL(prefix + "/publisher/invitations/" + token, window.location.origin).href);
      setCopied(false);
      setClaim(undefined);
      reload((n) => n + 1);
    } catch {
      setError(t("Invitation non créée. Vérifiez la demande et la marque sélectionnée.", "Invitation could not be created. Check the request and selected brand."));
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id: string) {
    setBusy(true);
    setError("");
    try {
      await listingRequest({ action: "revokeInvitation", id });
      setLink("");
      reload((n) => n + 1);
    } catch {
      setError(t("Impossible de révoquer cette invitation.", "Could not revoke this invitation."));
    } finally {
      setBusy(false);
    }
  }

  if (listingId && directory) return <InitialListingAdminReview listingId={listingId}
    brands={directory.brands} onBack={() => { setListingId(undefined); reload((n) => n + 1); }} />;
  return <section className={styles.queue} aria-busy={busy}>
    <BackofficePageHeading title={t("Demandes de fiche", "Listing requests")}
      action={<Button disabled={busy} onClick={onBack}>{t("Retour aux fiches", "Back to records")}</Button>} />
    {error && <Notice title={error} role="alert" actions={<Button onClick={() => {
      setError(""); reload((n) => n + 1);
    }}>{t("Actualiser", "Refresh")}</Button>} />}
    {!directory && !error && <p role="status">{t("Chargement des demandes…", "Loading requests…")}</p>}
    {link && <div className={styles.content}>
      <Field label={t("Lien d’invitation à transmettre", "Invitation link to share")} value={link} readOnly
        help={t("Ce lien est réservé au compte demandeur. Copiez-le avant de quitter cet écran.", "This link is bound to the requesting account. Copy it before leaving this page.")} />
      <Button onClick={() => void navigator.clipboard.writeText(link).then(() => setCopied(true)).catch(() => setCopied(false))}>
        {t("Copier le lien", "Copy link")}
      </Button>
      {copied && <p role="status">{t("Lien copié.", "Link copied.")}</p>}
    </div>}
    {directory && <>
      <section className={styles.content}>
        <h2>{t("Rattacher une fiche existante", "Claim an existing record")}</h2>
        {!directory.claims.length && <p>{t("Aucune demande de rattachement.", "No claims to review.")}</p>}
        <ul className={styles.rows}>{directory.claims.map((row) => <li key={row.ownerId + ":" + row.toolId}>
          <span>{row.slug} · {row.confirmedEmail}</span>
          <Button disabled={busy} onClick={() => {
            setClaim(row); setBrandId(""); setBrandName(""); setBrandDomain(""); setRole("owner"); setError("");
          }}>{t("Vérifier et inviter", "Verify and invite")}</Button>
        </li>)}</ul>
        {claim && <form className={styles.content} onSubmit={(event) => { event.preventDefault(); void invite(); }}>
          <h3>{claim.slug} · {claim.confirmedEmail}</h3>
          <SelectField label={t("Marque responsable de la fiche", "Brand responsible for this record")}
            value={brandId} onChange={(event) => setBrandId(event.target.value)}>
            <option value="">{t("Nouvelle marque", "New brand")}</option>
            {directory.brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name} · {brand.websiteDomain}</option>)}
          </SelectField>
          {brandId ? <SelectField label={t("Droits du demandeur", "Applicant permissions")} value={role}
            onChange={(event) => setRole(event.target.value)}>
            <option value="owner">{t("Propriétaire", "Owner")}</option>
            <option value="admin">{t("Administrateur de marque", "Brand administrator")}</option>
            <option value="editor">{t("Éditeur", "Editor")}</option>
            <option value="viewer">{t("Lecture seule", "View only")}</option>
          </SelectField> : <>
            <Field required label={t("Nom de la marque", "Brand name")} value={brandName} maxLength={160}
              onChange={(event) => setBrandName(event.target.value)} />
            <Field required label={t("Domaine vérifié", "Verified domain")} value={brandDomain} placeholder="example.com"
              onChange={(event) => setBrandDomain(event.target.value)} />
          </>}
          <div className={styles.actions}>
            <Button type="submit" variant="primary" disabled={busy}>{t("Créer le lien d’invitation", "Create invitation link")}</Button>
            <Button type="button" disabled={busy} onClick={() => setClaim(undefined)}>{t("Annuler", "Cancel")}</Button>
          </div>
        </form>}
      </section>
      <section className={styles.content}>
        <h2>{t("Nouvelles fiches", "New listings")}</h2>
        {directory.listings.length ? <ul className={styles.rows}>{directory.listings.map((row) => <li key={row.id}>
          <span>{row.name} · {row.confirmedEmail}</span>
          <Button disabled={busy} onClick={() => setListingId(row.id)}>{t("Examiner la fiche", "Review listing")}</Button>
        </li>)}</ul> : <p>{t("Aucune nouvelle fiche envoyée.", "No new listings submitted.")}</p>}
      </section>
      {directory.invitations.length > 0 && <section className={styles.content}>
        <h2>{t("Invitations", "Invitations")}</h2>
        <ul className={styles.rows}>{directory.invitations.map((row) => {
          const statuses = {
            pending: t("En attente", "Pending"), accepted: t("Acceptée", "Accepted"),
            revoked: t("Révoquée", "Revoked"), expired: t("Expirée", "Expired"),
          };
          return <li key={row.id}>
            <span>{row.toolId} · {statuses[row.status]} · {new Date(row.expiresAt).toLocaleDateString(lang)}</span>
            {row.status === "pending" && <Button disabled={busy} onClick={() => void revoke(row.id)}>{t("Révoquer", "Revoke")}</Button>}
          </li>;
        })}</ul>
      </section>}
    </>}
  </section>;
}
