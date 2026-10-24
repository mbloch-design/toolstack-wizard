// Share the route import with sign-in prefetching; importing never starts Auth or reads private data.
export const loadStackPage = () => import("@/pages/CartPage");
export const isStackReturn = (path: string | undefined) => !!path && /^\/(fr|en)\/(ma-stack|my-stack|panier|cart)(?:[?#]|$)/.test(path);
