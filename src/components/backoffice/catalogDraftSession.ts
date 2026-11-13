import type { CatalogEditorDetail, CatalogTool } from "@/lib/backofficeCatalog";
import { catalogCapabilities, isCatalogPathAllowed } from "@/lib/catalogPolicy";
import {
  validateCatalogDraft,
  catalogValidationIssues,
} from "@/lib/catalogValidation";
import { saveCatalogDraft } from "@/lib/backofficeCatalogApi";
import type { CatalogChange } from "./catalogEditingModel";

type Save = typeof saveCatalogDraft;
export type DraftEntry = {
  detail: CatalogEditorDetail;
  value: CatalogTool;
  base: CatalogTool;
  error?: unknown;
  saving: boolean;
  timer?: ReturnType<typeof setTimeout>;
  active?: Promise<void>;
  editedAt: number;
};
const equal = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);
/** In-memory, account-scoped recovery only; never serialized to browser storage. */
export type CatalogStagedBlock = { id: string; original: CatalogTool; value: CatalogTool };
export type CatalogStagedUpdate = CatalogStagedBlock | null | ((block: CatalogStagedBlock | null) => CatalogStagedBlock | null);

export class CatalogDraftSession {
  private records = new Map<string, DraftEntry>();
  private listeners = new Set<() => void>();
  private revision = 0;
  private owner: string | null = null;
  private enabled = true;
  private staged = new Map<string, CatalogStagedBlock>();
  constructor(private save: Save = saveCatalogDraft) {}
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  snapshot = () => this.revision;
  private emit() {
    this.revision++;
    this.listeners.forEach((l) => l());
  }
  get = (slug: string) => this.records.get(slug);
  get savedDrafts() {
    return [...this.records.values()].flatMap((e) =>
      e.detail.draft ? [e.detail.draft] : [],
    );
  }
  get stagedEditing() {
    return [...this.staged.values()].some((block) => !equal(block.original, block.value));
  }
  getStagedBlock(slug: string) { return this.staged.get(slug) ?? null; }
  setStagedBlock(slug: string, update: CatalogStagedUpdate) {
    const previous = this.getStagedBlock(slug);
    const block = typeof update === "function" ? update(previous) : update;
    if (previous === block) return;
    if (block) this.staged.set(slug, block);
    else this.staged.delete(slug);
    this.emit();
  }
  get dirty() {
    return [...this.records.values()].some(
      (e) => !equal(e.detail.tool, e.value) || e.saving,
    );
  }
  setOwner(id: string) {
    const resume = !this.enabled && this.owner === id;
    if (this.owner && this.owner !== id) this.clear();
    this.owner = id;
    this.enabled = true;
    if (resume) {
      for (const [slug, e] of this.records) {
        if (
          !e.error && !e.detail.conflict && !e.active &&
          e.detail.capabilities?.canSaveDraft && !equal(e.value, e.detail.tool)
        ) {
          clearTimeout(e.timer);
          e.timer = setTimeout(() => void this.persist(slug).catch(() => {}), 1000);
        }
      }
    }
    this.emit();
  }
  suspend() {
    this.enabled = false;
    for (const e of this.records.values()) clearTimeout(e.timer);
    this.emit();
  }
  clear() {
    for (const e of this.records.values()) clearTimeout(e.timer);
    this.records.clear();
    this.staged.clear();
    this.emit();
  }
  adopt(detail: CatalogEditorDetail, replace = false) {
    const slug = detail.tool.slug;
    const current = this.get(slug);
    if (current && !replace) {
      const conflict =
        detail.conflict ||
        detail.version !== current.detail.version ||
        detail.baseHash !== current.detail.baseHash;
      current.detail = {
        ...current.detail,
        capabilities: detail.capabilities,
        conflict,
      };
      if (conflict) current.error = { status: 409 };
      this.emit();
      return current;
    }
    const e: DraftEntry = {
      detail,
      value: detail.tool,
      base: detail.published,
      saving: false,
      editedAt: 0,
    };
    this.records.set(slug, e);
    this.emit();
    return e;
  }
  change(slug: string, changes: CatalogChange[], autosave = true) {
    const e = this.get(slug);
    if (!e || !this.enabled) return;
    const caps = e.detail.capabilities ?? catalogCapabilities(null);
    if (
      !changes.every(
        (c) =>
          isCatalogPathAllowed(caps, c.path) ||
          (caps.canPublishAll && c.path.at(-1) === "priceObservationId"),
      )
    ) {
      e.error = { status: 403 };
      this.emit();
      return;
    }
    const next = JSON.parse(JSON.stringify(e.value)) as CatalogTool;
    for (const c of changes) {
      if (
        !c.path.length ||
        c.path.some((p) =>
          ["__proto__", "constructor", "prototype"].includes(String(p)),
        )
      )
        continue;
      let target: Record<string | number, unknown> = next;
      c.path.slice(0, -1).forEach((part, i) => {
        if (target[part] == null)
          target[part] = typeof c.path[i + 1] === "number" ? [] : {};
        target = target[part] as typeof target;
      });
      const key = c.path.at(-1)!;
      if (c.remove) delete target[key];
      else target[key] = c.value;
    }
    e.value = next;
    e.editedAt = Date.now();
    if ((e.error as { status?: number })?.status !== 409) e.error = undefined;
    clearTimeout(e.timer);
    if (autosave)
      e.timer = setTimeout(() => void this.persist(slug).catch(() => {}), 1000);
    this.emit();
  }
  issues(slug: string) {
    const e = this.get(slug);
    return e ? catalogValidationIssues(e.base, e.value) : [];
  }
  private async persist(slug: string): Promise<void> {
    const e = this.get(slug);
    if (!e) return;
    if (e.active) return e.active;
    if (!this.enabled) throw { status: 401 };
    if (e.detail.conflict || (e.error as { status?: number })?.status === 409)
      throw { status: 409 };
    if (equal(e.value, e.detail.tool)) return;
    clearTimeout(e.timer);
    const caps = e.detail.capabilities ?? catalogCapabilities(null);
    let sent: CatalogTool;
    try {
      if (!caps.canSaveDraft) throw { status: 403 };
      sent = validateCatalogDraft(e.base, e.value, caps);
    } catch (error) {
      e.error = error;
      this.emit();
      throw error;
    }
    e.saving = true;
    e.error = undefined;
    this.emit();
    e.active = (async () => {
      try {
        const ack = await this.save({
          slug,
          version: e.detail.version,
          baseHash: e.detail.baseHash,
          value: sent,
        });
        if (this.get(slug) !== e) return;
        // The acknowledgement belongs exclusively to the transmitted immutable snapshot.
        e.detail = { ...ack, tool: sent };
      } catch (error) {
        if (this.get(slug) === e) e.error = error;
        throw error;
      } finally {
        e.saving = false;
        e.active = undefined;
        if (this.get(slug) === e) {
          this.emit();
          if (!e.error && !equal(e.value, e.detail.tool) && this.enabled) {
            clearTimeout(e.timer);
            e.timer = setTimeout(
              () => void this.persist(slug).catch(() => {}),
              Math.max(0, 1000 - (Date.now() - e.editedAt)),
            );
          }
        }
      }
    })();
    return e.active;
  }
  async flush() {
    for (const [slug, e] of this.records) {
      clearTimeout(e.timer);
      while (e.saving || !equal(e.value, e.detail.tool)) {
        await this.persist(slug);
        if (this.get(slug) !== e) break;
      }
    }
  }
  discardLocal(slug: string) {
    const e = this.get(slug);
    if (!e || e.saving) return;
    clearTimeout(e.timer);
    e.value = e.detail.tool;
    e.error = undefined;
    this.emit();
  }
}
