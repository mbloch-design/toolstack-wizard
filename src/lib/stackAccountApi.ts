import { validatePersonalStack, type PersonalStackRecord, type PersonalStackV4 } from "./personalStack";

export class StackAccountApiError extends Error {
  constructor(readonly status: number, readonly code: string) { super(code); this.name = "StackAccountApiError"; }
}

async function request(token: string, method: string, body?: unknown): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch("/api/stack-account", { method, cache: "no-store", headers: {
      Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  } catch { throw new StackAccountApiError(0, "STACK_ACCOUNT_NETWORK_ERROR"); }
  if (response.status === 204 && method === "DELETE") return;
  let value: unknown;
  try { value = await response.json(); } catch { throw new StackAccountApiError(response.ok ? 503 : response.status, "STACK_ACCOUNT_UNAVAILABLE"); }
  if (!response.ok) {
    const error = value && typeof value === "object" && "error" in value ? value.error : null;
    const code = error && typeof error === "object" && "code" in error && typeof error.code === "string" ? error.code : "STACK_ACCOUNT_UNAVAILABLE";
    throw new StackAccountApiError(response.status, code);
  }
  if (method === "DELETE") throw new StackAccountApiError(503, "ACCOUNT_DELETION_UNAVAILABLE");
  return value;
}

function record(value: unknown, nullable: boolean): PersonalStackRecord | null {
  if (!value || typeof value !== "object" || !("stack" in value)) throw new StackAccountApiError(503, "STACK_ACCOUNT_UNAVAILABLE");
  const stack = value.stack;
  if (stack === null && nullable) return null;
  if (!stack || typeof stack !== "object" || !("state" in stack) || !("revision" in stack) || !("updatedAt" in stack)
    || !Number.isSafeInteger(stack.revision) || (stack.revision as number) < 1 || typeof stack.updatedAt !== "string" || !Number.isFinite(Date.parse(stack.updatedAt))) {
    throw new StackAccountApiError(503, "STACK_ACCOUNT_UNAVAILABLE");
  }
  try { return { state: validatePersonalStack(stack.state), revision: stack.revision as number, updatedAt: stack.updatedAt }; }
  catch { throw new StackAccountApiError(503, "STACK_ACCOUNT_UNAVAILABLE"); }
}

export async function loadPersonalStack(token: string): Promise<PersonalStackRecord | null> {
  return record(await request(token, "GET"), true);
}
export async function savePersonalStack(token: string, input: { expectedRevision: number; state: PersonalStackV4 }): Promise<PersonalStackRecord> {
  const state = validatePersonalStack(input.state);
  return record(await request(token, "PUT", { expectedRevision: input.expectedRevision, state }), false)!;
}
export async function deletePersonalAccount(token: string): Promise<void> {
  await request(token, "DELETE");
}
