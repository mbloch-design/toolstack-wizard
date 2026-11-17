import { useEffect, useState } from "react";
import { useStackAccount } from "@/hooks/useStackAccount";
import { publisherRequest, type ListingRequest, type PublisherClaim, type PublisherTool } from "@/lib/publisherCatalogApi";

type Access = { tools: PublisherTool[]; listings: ListingRequest[]; claims: PublisherClaim[] };
type Snapshot = { owner: string; revision: number; data: Access | null };
const empty: Access = { tools: [], listings: [], claims: [] };

export function usePublisherAccess() {
  const account = useStackAccount();
  const { getAccessToken, user } = account;
  const owner = import.meta.env.VITE_PUBLISHER_CMS_ENABLED === "true" && account.enabled
    && account.authInitialized && account.syncStatus !== "session-expired"
    && (user?.email_confirmed_at || user?.confirmed_at) ? user.id : null;
  const [revision, refresh] = useState(0);
  const [snapshot, setSnapshot] = useState<Snapshot>();

  useEffect(() => {
    if (!owner) return;
    const accountId = owner;
    const controller = new AbortController();
    const options = { signal: controller.signal };
    async function load() {
      try {
        const [{ tools }, { listings, claims }] = await Promise.all([
          publisherRequest<{ tools: PublisherTool[] }>(getAccessToken, "/api/publisher-catalog", options),
          publisherRequest<{ listings: ListingRequest[]; claims: PublisherClaim[] }>(getAccessToken, "/api/listing-requests", options),
        ]);
        if (!Array.isArray(tools) || !Array.isArray(listings) || !Array.isArray(claims)) throw new Error("INVALID_PUBLISHER_ACCESS");
        if (!controller.signal.aborted) setSnapshot({ owner: accountId, revision, data: { tools, listings, claims } });
      } catch {
        if (!controller.signal.aborted) setSnapshot({ owner: accountId, revision, data: null });
      }
    }
    void load();
    return () => controller.abort();
  }, [getAccessToken, owner, revision]);

  const current = snapshot?.owner === owner && snapshot.revision === revision ? snapshot : undefined;
  const status = !owner ? "unavailable" : !current ? "loading" : current.data ? "ready" : "error";
  return { status, ...(current?.data ?? empty), retry: () => refresh((value) => value + 1) } as const;
}
