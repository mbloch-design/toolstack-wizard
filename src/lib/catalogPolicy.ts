import {
  CATALOG_FIELD_REGISTRY,
  catalogFieldAt,
} from "./catalogFieldRegistry.js";
export type CatalogCapabilities = {
  editablePaths: string[];
  canSaveDraft: boolean;
  canDiscardDraft: boolean;
  canPublishAll: boolean;
};
/** Construct only from a server-authenticated actor, never request-body metadata. */
export function catalogCapabilities(
  actor: { isAdmin: boolean; editablePaths?: string[] } | null,
): CatalogCapabilities {
  const editablePaths = actor?.isAdmin
    ? CATALOG_FIELD_REGISTRY.filter(
        (f) =>
          f.editable &&
          (!actor.editablePaths || actor.editablePaths.includes(f.path)),
      ).map((f) => f.path)
    : [];
  return {
    editablePaths,
    canSaveDraft: !!actor?.isAdmin && editablePaths.length > 0,
    canDiscardDraft: !!actor?.isAdmin,
    canPublishAll: !!actor?.isAdmin && !actor.editablePaths,
  };
}
export function isCatalogPathAllowed(
  capabilities: CatalogCapabilities | undefined,
  path: readonly (string | number)[],
): boolean {
  const entry = catalogFieldAt(path);
  return (
    !!capabilities?.canSaveDraft &&
    !!entry?.editable &&
    capabilities.editablePaths.includes(entry.path)
  );
}
