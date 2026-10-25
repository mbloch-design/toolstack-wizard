import {
  normalizeOAuthAvatar,
  normalizeProviderLocale,
} from "./accountIdentityProfile.js";
import {
  isTrade,
  normalizeStoredPersonalStack,
  type PersonalStackRecord,
  type Trade,
} from "./personalStack.js";

export type AccountInsights = {
  usedTools: number;
  wishlistTools: number;
  boards: number;
  trade: Trade | null;
  hasDailyRate: boolean;
  amounts: number;
  usage: number;
  decisions: number;
};
export function summarizeAccountStack(input: unknown): AccountInsights {
  const state = normalizeStoredPersonalStack(input);
  return {
    usedTools: state.selection.toolEntries.filter(
      (entry) => entry.intent === "stack",
    ).length,
    wishlistTools: state.selection.toolEntries.filter(
      (entry) => entry.intent === "wishlist",
    ).length,
    boards: state.selection.needs.length,
    trade: state.trade,
    hasDailyRate: state.dailyRate !== null,
    amounts: Object.keys(state.billing.choices).length,
    usage: Object.keys(state.usage).length,
    decisions: Object.keys(state.decisions).length,
  };
}

export type AccountSummary = {
  userId: string;
  email: string | null;
  displayName: string | null;
  createdAt: string | null;
  hasStack: boolean;
  stackUpdatedAt: string | null;
  insights?: AccountInsights | null;
};
export type AccountsDashboard = {
  totals: {
    accounts: number;
    accountsWithStack: number;
    nonemptyStacks: number;
  };
  topTools: {
    toolSlug: string;
    usedAccounts: number;
    wishlistAccounts: number;
  }[];
  accounts: AccountSummary[];
  page: number;
  pageSize: number;
  total: number;
  updatedAt: string;
};
export type AccountDetail = Omit<
  AccountSummary,
  "hasStack" | "stackUpdatedAt" | "insights"
> & {
  stack: PersonalStackRecord | null;
  avatarUrl: string | null;
  providerLocale: string | null;
  oauthProfileSource: "google" | "github" | null;
  identity?: {
    lastSignInAt: string | null;
    emailConfirmedAt: string | null;
    locale: string | null;
  };
};

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid accounts response");
  return value as Record<string, unknown>;
}
function text(value: unknown): string {
  if (typeof value !== "string") throw new Error("Invalid accounts response");
  return value;
}
function optionalText(value: unknown): string | null {
  return value === null ? null : text(value);
}
function date(value: unknown): string {
  const result = text(value);
  if (!Number.isFinite(Date.parse(result)))
    throw new Error("Invalid accounts response");
  return result;
}
function optionalDate(value: unknown): string | null {
  return value === null ? null : date(value);
}
function count(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0)
    throw new Error("Invalid accounts response");
  return value as number;
}
function parseInsights(input: unknown): AccountInsights | null {
  if (input === null) return null;
  const value = record(input);
  if (
    typeof value.hasDailyRate !== "boolean" ||
    !(value.trade === null || isTrade(value.trade))
  )
    throw new Error("Invalid accounts response");
  return {
    usedTools: count(value.usedTools),
    wishlistTools: count(value.wishlistTools),
    boards: count(value.boards),
    trade: value.trade,
    hasDailyRate: value.hasDailyRate,
    amounts: count(value.amounts),
    usage: count(value.usage),
    decisions: count(value.decisions),
  };
}
function identity(value: Record<string, unknown>) {
  return {
    userId: text(value.userId),
    email: optionalText(value.email),
    displayName: optionalText(value.displayName),
    createdAt: optionalDate(value.createdAt),
  };
}

/** Validate the complete source response; missing totals never silently become zero. */
export function parseAccountsDashboard(input: unknown): AccountsDashboard {
  const value = record(input);
  const totals = record(value.totals);
  const accounts = count(totals.accounts),
    accountsWithStack = count(totals.accountsWithStack),
    nonemptyStacks = count(totals.nonemptyStacks);
  const page = count(value.page),
    pageSize = count(value.pageSize),
    total = count(value.total);
  if (
    page < 1 ||
    pageSize < 1 ||
    pageSize > 100 ||
    nonemptyStacks > accountsWithStack ||
    accountsWithStack > accounts ||
    total > accounts ||
    !Array.isArray(value.accounts) ||
    value.accounts.length > pageSize ||
    !Array.isArray(value.topTools)
  )
    throw new Error("Invalid accounts response");
  return {
    totals: { accounts, accountsWithStack, nonemptyStacks },
    page,
    pageSize,
    total,
    updatedAt: date(value.updatedAt),
    accounts: value.accounts.map((inputRow) => {
      const row = record(inputRow);
      if (typeof row.hasStack !== "boolean")
        throw new Error("Invalid accounts response");
      return {
        ...identity(row),
        hasStack: row.hasStack,
        stackUpdatedAt: optionalDate(row.stackUpdatedAt),
        ...(row.insights !== undefined
          ? { insights: parseInsights(row.insights) }
          : {}),
      };
    }),
    topTools: value.topTools.map((inputTool) => {
      const tool = record(inputTool);
      return {
        toolSlug: text(tool.toolSlug),
        usedAccounts: count(tool.usedAccounts),
        wishlistAccounts: count(tool.wishlistAccounts),
      };
    }),
  };
}

/** Historical selections are normalized on response only; no database rewrite. */
export function parseAccountDetail(input: unknown): AccountDetail | null {
  if (input === null) return null;
  const value = record(input);
  let stack: PersonalStackRecord | null = null;
  if (value.stack !== null) {
    const saved = record(value.stack);
    const revision = count(saved.revision);
    if (revision < 1) throw new Error("Invalid accounts response");
    record(saved.state);
    stack = {
      state: normalizeStoredPersonalStack(saved.state),
      revision,
      updatedAt: date(saved.updatedAt),
    };
  }
  if (
    !(
      value.oauthProfileSource === null ||
      value.oauthProfileSource === "google" ||
      value.oauthProfileSource === "github"
    ) ||
    !(
      value.avatarUrl === null ||
      (typeof value.avatarUrl === "string" &&
        normalizeOAuthAvatar(value.avatarUrl, null) === value.avatarUrl)
    ) ||
    !(
      value.providerLocale === null ||
      (typeof value.providerLocale === "string" &&
        normalizeProviderLocale(value.providerLocale) === value.providerLocale)
    )
  )
    throw new Error("Invalid accounts response");
  const extra =
    value.identity === undefined ? undefined : record(value.identity);
  return {
    ...identity(value),
    stack,
    avatarUrl: value.avatarUrl as string | null,
    providerLocale: value.providerLocale as string | null,
    oauthProfileSource: value.oauthProfileSource,
    ...(extra
      ? {
          identity: {
            lastSignInAt: optionalDate(extra.lastSignInAt),
            emailConfirmedAt: optionalDate(extra.emailConfirmedAt),
            locale: optionalText(extra.locale),
          },
        }
      : {}),
  };
}
