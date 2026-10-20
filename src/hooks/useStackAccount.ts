import { createContext, createElement, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { STACK_ACCOUNT_ENABLED } from "@/config/features";
import { StackAccountCoordinator, type AccountAuthOptions, type AccountSnapshot } from "@/lib/stackAccountCoordinator";
import type { ToolCartState } from "@/lib/stackState";
export type { StackSyncStatus, DraftChoice, StackConflict } from "@/lib/stackAccountCoordinator";
export type { AuthResult, AuthMethod, AccountAuthOptions } from "@/lib/accountAuth";
export { getStackAccountReturnUrl } from "@/lib/stackAccountCoordinator";

type Actions = Pick<StackAccountCoordinator, "loadSaved" | "addDraft" | "reloadLatest" | "keepCurrent" | "retry" | "signInWithGoogle" | "sendEmailCode" | "verifyEmailCode" | "signOut" | "deleteAccount" | "clearLocalAccount" | "signInWithProvider" | "signInWithPassword" | "signUpWithPassword" | "resendConfirmation" | "requestPasswordReset" | "completePasswordReset" | "getAccessToken">;
export type StackAccountContext = AccountSnapshot & Actions & { enabled: boolean; sendMagicLink: Actions["sendEmailCode"] };
const Context = createContext<StackAccountContext | null>(null);

/** Mount once above routes. Page hooks never create auth listeners or autosave loops. */
export function StackAccountProvider({ children, enabled = STACK_ACCOUNT_ENABLED }: { children: ReactNode; enabled?: boolean }) {
  const [coordinator] = useState(() => new StackAccountCoordinator(supabase.auth, enabled));
  const snapshot = useSyncExternalStore(coordinator.subscribe, coordinator.getSnapshot, coordinator.getServerSnapshot);
  useEffect(() => coordinator.start(), [coordinator]);
  const value = useMemo<StackAccountContext>(() => ({ ...snapshot, enabled: coordinator.enabled,
    signInWithProvider: coordinator.signInWithProvider, signInWithPassword: coordinator.signInWithPassword,
    signUpWithPassword: coordinator.signUpWithPassword, resendConfirmation: coordinator.resendConfirmation,
    requestPasswordReset: coordinator.requestPasswordReset, completePasswordReset: coordinator.completePasswordReset,
    getAccessToken: coordinator.getAccessToken,
    loadSaved: coordinator.loadSaved, addDraft: coordinator.addDraft, reloadLatest: coordinator.reloadLatest,
    keepCurrent: coordinator.keepCurrent, retry: coordinator.retry, signInWithGoogle: coordinator.signInWithGoogle,
    sendEmailCode: coordinator.sendEmailCode, sendMagicLink: coordinator.sendEmailCode,
    verifyEmailCode: coordinator.verifyEmailCode, signOut: coordinator.signOut, deleteAccount: coordinator.deleteAccount, clearLocalAccount: coordinator.clearLocalAccount,
  }), [coordinator, snapshot]);
  return createElement(Context.Provider, { value }, children);
}

// Old options remain accepted for source compatibility; the complete shared store is authoritative.
export function useStackAccount(_options?: AccountAuthOptions & { enabled?: boolean; state?: ToolCartState; replaceState?: (state: ToolCartState) => void }): StackAccountContext {
  const value = useContext(Context);
  if (!value) throw new Error("useStackAccount requires StackAccountProvider");
  return value;
}

export function getStackAccountLabel(user: User | null) {
  if (!user) return null;
  return user.user_metadata?.full_name || user.user_metadata?.name || user.email || null;
}
