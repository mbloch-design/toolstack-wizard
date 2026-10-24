import { useCallback, useEffect, useRef, useState } from "react";
import type { AccountProfile } from "../lib/accountProfile";
import { AccountProfileValidationError } from "../lib/accountProfile";
import { AccountProfileApiError, loadAccountProfile, saveAccountProfile } from "../lib/accountProfileApi";

type ProfileStatus = "idle" | "loading" | "ready" | "saving" | "error";
type ProfileState = { owner: string | null; generation: number; profile: AccountProfile | null; status: ProfileStatus; error: string | null };
/** No Auth subscription and no credential cache. Each operation asks the existing coordinator. */
export function useAccountProfile(userId: string | null, getAccessToken: () => Promise<string | null>, enabled: boolean) {
  const owner = enabled ? userId : null;
  const identity = useRef({ owner, generation: 0 });
  if (identity.current.owner !== owner) identity.current = { owner, generation: identity.current.generation + 1 };
  const tokenGetter = useRef(getAccessToken); tokenGetter.current = getAccessToken;
  const operation = useRef(0);
  const active = useRef<AbortController | null>(null);
  const [state, setState] = useState<ProfileState>({ owner: null, generation: -1, profile: null, status: "idle", error: null });
  const run = useCallback(async (name?: string | null): Promise<boolean> => {
    const scope = identity.current;
    if (!scope.owner) return false;
    const op = ++operation.current;
    active.current?.abort();
    const controller = new AbortController(); active.current = controller;
    const valid = () => identity.current === scope && operation.current === op && !controller.signal.aborted;
    setState(previous => ({ owner: scope.owner, generation: scope.generation,
      profile: previous.owner === scope.owner && previous.generation === scope.generation ? previous.profile : null,
      status: name === undefined ? "loading" : "saving", error: null }));
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stop!: () => void;
    const interrupted = new Promise<never>((_, reject) => {
      stop = () => reject(new AccountProfileApiError(0, "ACCOUNT_PROFILE_CANCELLED"));
      controller.signal.addEventListener("abort", stop, { once: true });
      timer = setTimeout(() => reject(new AccountProfileApiError(0, "ACCOUNT_PROFILE_TIMEOUT")), 10000);
    });
    try {
      const work = async () => {
        const token = await tokenGetter.current();
        if (!valid()) throw new AccountProfileApiError(0, "ACCOUNT_PROFILE_CANCELLED");
        if (!token) throw new AccountProfileApiError(401, "ACCOUNT_SESSION_INVALID");
        return name === undefined ? loadAccountProfile(token, controller.signal) : saveAccountProfile(token, name, controller.signal);
      };
      const profile = await Promise.race([work(), interrupted]);
      if (!valid()) return false;
      if (profile.userId !== scope.owner) throw new AccountProfileApiError(503, "ACCOUNT_PROFILE_UNAVAILABLE");
      setState({ owner: scope.owner, generation: scope.generation, profile, status: "ready", error: null });
      return true;
    } catch (cause) {
      if (!valid()) return false;
      const error = cause instanceof AccountProfileApiError ? cause.code : cause instanceof AccountProfileValidationError ? "INVALID_ACCOUNT_PROFILE" : "ACCOUNT_PROFILE_UNAVAILABLE";
      setState(previous => ({ ...previous, status: "error", error }));
      return false;
    } finally {
      if (timer) clearTimeout(timer);
      controller.signal.removeEventListener("abort", stop);
      // A non-cooperative transport may settle later, but cannot publish state.
      controller.abort();
      if (active.current === controller) active.current = null;
    }
  }, []);
  const cancel = useCallback(() => { ++operation.current; active.current?.abort(); }, []);
  useEffect(() => {
    if (owner) void run();
    else setState(previous => previous.owner === null && previous.profile === null && previous.status === "idle" && previous.error === null
      ? previous
      : { owner: null, generation: identity.current.generation, profile: null, status: "idle", error: null });
    return cancel;
  }, [owner, run, cancel]);
  const retry = useCallback(() => { void run(); }, [run]);
  const saveDisplayName = useCallback((name: string | null) => run(name), [run]);
  const visible = owner && state.owner === owner && state.generation === identity.current.generation;
  return { profile: visible ? state.profile : null, status: visible ? state.status : owner ? "loading" as const : "idle" as const,
    error: visible ? state.error : null, saveDisplayName, retry };
}
