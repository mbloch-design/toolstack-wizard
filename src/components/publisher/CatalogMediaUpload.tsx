import { useEffect, useRef, useState } from "react";
import Button from "@/ds/Button/Button";
import Field from "@/ds/Field/Field";
import { useLang } from "@/hooks/useLang";
import { supabase } from "@/integrations/supabase/client";
import { publisherRequest, type PublisherToken } from "@/lib/publisherCatalogApi";
import type { ProductDraft } from "@/lib/publisherCatalog";
import styles from "./PublisherWorkspace.module.css";

type Media = ProductDraft["media"][number];
type Preview = { assetId: string; state: "ready"; previewUrl: string; expiresAt: string };
type Reservation = { assetId: string; path: string; expiresAt: string; state: "reserved" | "ready"; uploadRequired?: boolean };
const mediaApi = "/api/catalog-media";
const accepted = ["image/png", "image/jpeg", "image/webp"];
const maxBytes = 5 * 1024 * 1024;

export function CatalogMediaPreview({ asset, locale, getToken }: { asset: Media; locale: "fr" | "en"; getToken: PublisherToken }) {
  const [url, setUrl] = useState("");
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const { t } = useLang();
  useEffect(() => {
    const controller = new AbortController();
    void publisherRequest<Preview>(getToken, mediaApi + `?assetId=${encodeURIComponent(asset.assetId)}`, {
      signal: controller.signal,
    }).then((preview) => {
      if (!controller.signal.aborted) setUrl(preview.previewUrl);
    }, () => {
      if (!controller.signal.aborted) setFailed(true);
    });
    return () => controller.abort();
  }, [asset.assetId, getToken, retry]);

  if (failed) return <div className={styles.actions}>
    <span className={styles.muted}>{t("Aperçu indisponible", "Preview unavailable")}</span>
    <Button variant="quiet" onClick={() => { setFailed(false); setUrl(""); setRetry(retry + 1); }}>{t("Réessayer l’aperçu", "Retry preview")}</Button>
  </div>;
  return url ? <img className={styles.asset} src={url} alt={asset.alt[locale]} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} /> : null;
}

export default function CatalogMediaUpload({ toolId, role, replaceAssetId, getToken, onReady, setUploading, disabled }: {
  toolId: string; role: Media["role"]; replaceAssetId?: string; getToken: PublisherToken;
  onReady: (assetId: string) => void; setUploading: (value: boolean) => void; disabled?: boolean;
}) {
  const { t } = useLang();
  const [file, setFile] = useState<File | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const key = useRef("");
  const active = useRef<AbortController | null>(null);
  useEffect(() => {
    const scope = new AbortController();
    active.current = scope;
    return () => scope.abort();
  }, []);

  async function upload() {
    if (!file || active.current?.signal.aborted || busy || disabled) return;
    if (file.size === 0 || file.size > maxBytes || !accepted.includes(file.type)) {
      setError(t("Choisissez une image PNG, JPEG ou WebP de 5 Mio maximum.", "Choose a PNG, JPEG or WebP image up to 5 MiB."));
      return;
    }
    const signal = active.current?.signal;
    setError("");
    setBusy(true);
    setUploading(true);
    try {
      const reserved = await publisherRequest<Reservation>(getToken, mediaApi, { method: "POST", signal, body: {
        action: "reserve", target: { kind: "tool", id: toolId }, role, mimeType: file.type, bytes: file.size,
        idempotencyKey: key.current, ...(replaceAssetId && { replaceAssetId }),
      } });
      if (signal?.aborted) return;
      if (reserved.state === "reserved") {
        if (reserved.uploadRequired !== false) {
          const { error } = await supabase.storage.from("catalog-drafts").upload(reserved.path, file, {
            upsert: false, contentType: file.type,
          });
          if (error && !["409", "Duplicate"].includes(String("statusCode" in error ? error.statusCode : ""))) throw error;
        }
        if (signal?.aborted) return;
        await publisherRequest<Preview>(getToken, mediaApi, {
          method: "POST", signal, body: { action: "finalize", assetId: reserved.assetId },
        });
      }
      if (signal?.aborted) return;
      onReady(reserved.assetId);
      setFile(null);
      if (input.current) input.current.value = "";
    } catch {
      if (!signal?.aborted) setError(t("Le visuel n’a pas pu être téléversé. Le brouillon conserve ses visuels précédents.", "The image could not be uploaded. The draft keeps its previous images."));
    } finally {
      if (!signal?.aborted) {
        setBusy(false);
        setUploading(false);
      }
    }
  }

  const labels = { logo: t("Logo", "Logo"), cover: t("Couverture", "Cover image"), gallery: t("Capture", "Screenshot") };
  return <div className={styles.fields}>
    <Field inputRef={input} type="file" accept={accepted.join(",")} disabled={busy || disabled} label={labels[role]}
      onChange={(event) => { setFile(event.target.files?.[0] ?? null); key.current = crypto.randomUUID(); setError(""); }} />
    {file && <div className={styles.actions}>
      <Button disabled={busy || disabled} onClick={() => void upload()}>
        {busy ? t("Téléversement…", "Uploading…") : replaceAssetId ? t("Téléverser le remplacement", "Upload replacement") : t("Téléverser le visuel", "Upload image")}
      </Button>
      {!busy && <Button variant="quiet" onClick={() => { setFile(null); setError(""); if (input.current) input.current.value = ""; }}>{t("Annuler le téléversement", "Cancel upload")}</Button>}
    </div>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
  </div>;
}
