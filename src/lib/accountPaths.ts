export type AccountLang = 'fr' | 'en';
export type AccountPathKind = 'signin' | 'signup' | 'callback' | 'reset' | 'settings';
const paths = {
  fr: { signin: 'connexion', signup: 'inscription', callback: 'connexion/retour', reset: 'compte/reinitialiser', settings: 'compte/parametres' },
  en: { signin: 'sign-in', signup: 'sign-up', callback: 'sign-in/callback', reset: 'account/reset-password', settings: 'account/settings' },
} as const;
export function accountPath(lang: AccountLang, kind: AccountPathKind): string { return `/${lang}/${paths[lang][kind]}`; }
const publicPages = new Set(['', 'ma-stack', 'my-stack', 'panier', 'cart', 'tools', 'tool', 'category', 'categories', 'guides', 'guide', 'stacks', 'stack', 'comparatifs', 'comparatif', 'explorer', 'about', 'methodology', 'transparency', 'contact', 'submit', 'legal-notice', 'privacy-policy', 'terms', 'search', 'back-office']);
const transport = /^(access_token|refresh_token|provider_token|provider_refresh_token|token|token_hash|code|type|expires_in|expires_at|error|error_code|error_description|recovery)$/i;
/** A relative, known same-origin destination. Auth transport is never navigation state. */
export function safeAccountReturnTo(input: string | null | undefined, lang: AccountLang, origin: string): string {
  const fallback = `/${lang}/ma-stack`;
  if (!input || input.includes('\\') || [...input].some(char => char.charCodeAt(0) < 32)) return fallback;
  try {
    const url = new URL(input, origin);
    if (url.origin !== new URL(origin).origin || /%2f|%5c/i.test(url.pathname)) return fallback;
    const [, routeLang, page = ''] = url.pathname.split('/');
    if (routeLang !== 'fr' && routeLang !== 'en') return fallback;
    if (url.pathname === accountPath(routeLang, 'callback') || url.pathname === accountPath(routeLang, 'reset')) return fallback;
    if (!publicPages.has(page) && !(['signin', 'signup', 'settings'] as const).some(kind => url.pathname === accountPath(routeLang, kind))) return fallback;
    for (const key of [...url.searchParams.keys()]) if (transport.test(key)) url.searchParams.delete(key);
    if ([...new URLSearchParams(url.hash.slice(1)).keys()].some(key => transport.test(key))) url.hash = '';
    return `${url.pathname}${url.search}${url.hash}`;
  } catch { return fallback; }
}
