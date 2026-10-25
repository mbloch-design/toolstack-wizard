import { toast } from "sonner";
import { STACK_AUTH_REQUIRED_EVENT } from "@/lib/stackAuthAccess";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useStackAccount } from "@/hooks/useStackAccount";
import { useAccountProfile } from "@/hooks/useAccountProfile";
import { safeAccountReturnTo } from "@/lib/accountPaths";
import AccountAuthDialog from "./AccountAuthDialog";
import AccountLifecycleDialog from "./AccountLifecycleDialog";
import { AccountPrivacyNotice } from "./AccountStackStatus";
import type { AuthMode } from "./AccountAuthForm";
type Experience = ReturnType<typeof useAccountProfile> & {
  openAuth: (mode: AuthMode, returnTo?: string) => void;
  requestSignOut: () => void;
  requestDeleteAccount: () => void;
};
const Context = createContext<Experience | null>(null);
// Shared presentation context intentionally lives next to its provider.
// eslint-disable-next-line react-refresh/only-export-components
export function useAccountExperience() {
  const value = useContext(Context);
  if (!value)
    throw new Error("useAccountExperience requires AccountExperienceProvider");
  return value;
}
export default function AccountExperienceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const account = useStackAccount();
  const { lang, t } = useLang();
  const location = useLocation();
  const navigate = useNavigate();
  const profile = useAccountProfile(
    account.user?.id ?? null,
    account.getAccessToken,
    account.enabled && account.syncStatus !== "session-expired",
  );
  const [intent, setIntent] = useState<{
    mode: AuthMode;
    returnTo: string;
    open: boolean;
  } | null>(null);
  const [lifecycle, setLifecycle] = useState<{
    kind: "signout" | "delete";
    owner: string;
  } | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (lifecycle && lifecycle.owner !== account.user?.id) setLifecycle(null);
  }, [lifecycle, account.user?.id]);
  const rememberFocus = () => {
    trigger.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
  };
  const restoreFocus = () => {
    if (trigger.current?.isConnected) trigger.current.focus();
    else document.querySelector<HTMLElement>(".ac-header-trigger")?.focus();
  };
  const openAuth = useCallback((mode: AuthMode, returnTo?: string) => {
    trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setIntent({
      mode,
      returnTo: safeAccountReturnTo(
        returnTo ?? `${location.pathname}${location.search}${location.hash}`,
        lang,
        window.location.origin,
      ),
      open: true,
    });
  }, [lang, location.pathname, location.search, location.hash]);
  useEffect(() => {
    if (!account.enabled) return;
    const request = (event: Event) => {
      const mode = (event as CustomEvent<{mode?: string}>).detail?.mode;
      openAuth(mode === "signin" ? "signin" : "signup");
    };
    window.addEventListener(STACK_AUTH_REQUIRED_EVENT, request);
    return () => window.removeEventListener(STACK_AUTH_REQUIRED_EVENT, request);
  }, [account.enabled, openAuth]);
  // Closing while SDK authentication is pending clears the form, but keeps its return intent.
  // A later successful session reopens the central stack decision rather than hiding it.
  useEffect(() => {
    if (
      intent &&
      !intent.open &&
      account.user &&
      account.syncStatus !== "session-expired"
    )
      setIntent((previous) => (previous ? { ...previous, open: true } : null));
  }, [intent, account.user, account.syncStatus]);
  const complete = useCallback(() => {
    if (!intent) return;
    const destination = intent.returnTo;
    setIntent(null);
    if (
      destination !== `${location.pathname}${location.search}${location.hash}`
    )
      navigate(destination, { replace: true });
  }, [intent, location.pathname, location.search, location.hash, navigate]);
  const close = () => {
    if (account.pendingDraftChoice) return;
    setIntent((previous) =>
      account.authBusy && previous ? { ...previous, open: false } : null,
    );
  };
  // These dialogs originate only from these actions, never historical coordinator flags.
  const requestSignOut = () => {
    rememberFocus();
    if (account.user) setLifecycle({ kind: "signout", owner: account.user.id });
  };
  const requestDeleteAccount = () => {
    rememberFocus();
    if (account.user) setLifecycle({ kind: "delete", owner: account.user.id });
  };
  return (
    <Context.Provider
      value={{ ...profile, openAuth, requestSignOut, requestDeleteAccount }}
    >
      {children}
      {account.enabled && (
        <>
          <div className="ac-global-notice">
            <AccountPrivacyNotice />
          </div>
          {intent && (
            <AccountAuthDialog
              open={intent.open}
              mode={intent.mode}
              returnTo={intent.returnTo}
              onModeChange={(mode) =>
                setIntent((previous) =>
                  previous ? { ...previous, mode } : null,
                )
              }
              onClose={close}
              onComplete={complete}
              restoreFocus={restoreFocus}
            />
          )}{" "}
          {lifecycle && lifecycle.owner === account.user?.id && (
            <AccountLifecycleDialog
              key={`${lifecycle.kind}:${lifecycle.owner}`}
              kind={lifecycle.kind}
              onSignedOut={() => {
                setIntent(null);
                navigate(`/${lang}`, { replace: true });
                toast.success(t("Vous êtes déconnecté. À très vite !", "You’re signed out. See you soon!"));
              }}
              onClose={() => setLifecycle(null)}
              restoreFocus={restoreFocus}
            />
          )}
        </>
      )}
    </Context.Provider>
  );
}
