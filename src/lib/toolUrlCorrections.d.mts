export declare function resolveAuditedToolUrl(slug: string | undefined, field: string, url: string | null | undefined): string | null | undefined;
export declare function applyAuditedToolUrls<T extends { slug?: string; id?: string }>(tool: T): T;
export declare function isAuditedToolCoverUrl(slug: string | undefined, url: string | null | undefined): boolean;
