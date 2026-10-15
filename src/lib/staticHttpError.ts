// A static 404 can match a dynamic React route such as /tool/:slug. Preserve
// the server's error for that initial path instead of mounting an indexable
// catalogue/explorer page. Other paths still use the existing SPA router.
const initialNotFoundPath = typeof document !== 'undefined'
  && document.querySelector('meta[name="tooltrim-http-status"][content="404"]')
  ? window.location.pathname
  : null;

export function isStaticNotFoundPath(pathname: string): boolean {
  return initialNotFoundPath !== null && pathname === initialNotFoundPath;
}
