import { useCallback, useEffect, useRef, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { STACK_STATE_VERSION, type ToolCartState } from "@/lib/stackState";
import { mergeToolCartStates, stackStateFingerprint } from "@/lib/stackSync";

export type StackSyncStatus = "local" | "connecting" | "syncing" | "synced" | "error";

interface UseStackAccountOptions {
  enabled?: boolean;
  lang: "fr" | "en";
  state: ToolCartState;
  replaceState: (state: ToolCartState) => void;
}

function getReturnUrl(lang: "fr" | "en") {
  if (typeof window === "undefined") return undefined;
  return `${window.location.origin}/${lang}/ma-stack?compte=retour`;
}

export function useStackAccount({ enabled = true, lang, state, replaceState }: UseStackAccountOptions) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<StackSyncStatus>("local");
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSentTo, setMagicLinkSentTo] = useState<string | null>(null);
  const hydratedUserRef = useRef<string | null>(null);
  const lastUploadedRef = useRef<string | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (!enabled) return;
    let mounted = true;
    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!mounted) return;
      if (sessionError) {
        setError(sessionError.message);
        setStatus("error");
        return;
      }
      setSession(data.session);
      setStatus(data.session ? "connecting" : "local");
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setError(null);
      setStatus(nextSession ? "connecting" : "local");
      if (!nextSession) {
        hydratedUserRef.current = null;
        lastUploadedRef.current = null;
      }
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const user = session?.user;
    if (!user || hydratedUserRef.current === user.id) return;
    let cancelled = false;

    async function hydrate() {
      setStatus("syncing");
      const { data, error: loadError } = await supabase
        .from("stack_snapshots")
        .select("state, revision")
        .eq("owner_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (loadError) throw loadError;

      const merged = data?.state
        ? mergeToolCartStates(stateRef.current, data.state)
        : stateRef.current;
      const now = new Date().toISOString();
      const fingerprint = stackStateFingerprint(merged);
      const { error: saveError } = await supabase.from("stack_snapshots").upsert({
        owner_id: user.id,
        state: merged as unknown as Json,
        state_version: STACK_STATE_VERSION,
        revision: (data?.revision || 0) + 1,
        updated_at: now,
      }, { onConflict: "owner_id" });
      if (saveError) throw saveError;

      const metadata = user.user_metadata || {};
      await supabase.from("profiles").upsert({
        id: user.id,
        display_name: metadata.full_name || metadata.name || user.email?.split("@")[0] || null,
        avatar_url: metadata.avatar_url || metadata.picture || null,
        locale: lang,
        updated_at: now,
      }, { onConflict: "id" });

      if (cancelled) return;
      hydratedUserRef.current = user.id;
      lastUploadedRef.current = fingerprint;
      replaceState(merged);
      setStatus("synced");
      setError(null);
    }

    void hydrate().catch((cause) => {
      if (cancelled) return;
      setError(cause instanceof Error ? cause.message : "Synchronization failed");
      setStatus("error");
    });
    return () => { cancelled = true; };
  }, [enabled, lang, replaceState, session?.user]);

  useEffect(() => {
    if (!enabled) return;
    const user = session?.user;
    if (!user || hydratedUserRef.current !== user.id) return;
    const fingerprint = stackStateFingerprint(state);
    if (fingerprint === lastUploadedRef.current) return;
    const timer = window.setTimeout(() => {
      setStatus("syncing");
      void supabase.from("stack_snapshots").upsert({
        owner_id: user.id,
        state: state as unknown as Json,
        state_version: STACK_STATE_VERSION,
        updated_at: new Date().toISOString(),
      }, { onConflict: "owner_id" }).then(({ error: saveError }) => {
        if (saveError) {
          setError(saveError.message);
          setStatus("error");
          return;
        }
        lastUploadedRef.current = fingerprint;
        setError(null);
        setStatus("synced");
      });
    }, 650);
    return () => window.clearTimeout(timer);
  }, [enabled, session?.user, state]);

  const signInWithGoogle = useCallback(async () => {
    if (!enabled) return;
    setStatus("connecting");
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: getReturnUrl(lang) },
    });
    if (signInError) {
      setError(signInError.message);
      setStatus("error");
    }
  }, [enabled, lang]);

  const sendMagicLink = useCallback(async (email: string) => {
    if (!enabled) return false;
    setStatus("connecting");
    setError(null);
    setMagicLinkSentTo(null);
    const normalizedEmail = email.trim().toLowerCase();
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: { emailRedirectTo: getReturnUrl(lang), shouldCreateUser: true },
    });
    if (signInError) {
      setError(signInError.message);
      setStatus("error");
      return false;
    }
    setMagicLinkSentTo(normalizedEmail);
    setStatus("local");
    return true;
  }, [enabled, lang]);

  const signOut = useCallback(async () => {
    if (!enabled) return;
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(signOutError.message);
      setStatus("error");
    }
  }, [enabled]);

  const deleteAccount = useCallback(async () => {
    if (!enabled) return false;
    setStatus("syncing");
    const { error: deleteError } = await supabase.functions.invoke("delete-account", {
      method: "DELETE",
    });
    if (deleteError) {
      setError(deleteError.message);
      setStatus("error");
      return false;
    }
    await supabase.auth.signOut({ scope: "local" });
    setSession(null);
    setStatus("local");
    return true;
  }, [enabled]);

  return {
    user: session?.user || null,
    status,
    error,
    magicLinkSentTo,
    signInWithGoogle,
    sendMagicLink,
    signOut,
    deleteAccount,
  };
}

export function getStackAccountLabel(user: User | null) {
  if (!user) return null;
  const metadata = user.user_metadata || {};
  return metadata.full_name || metadata.name || user.email || null;
}
