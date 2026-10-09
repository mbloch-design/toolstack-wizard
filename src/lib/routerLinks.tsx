import { forwardRef } from "react";
import { Link as RouterLink, NavLink as RouterNavLink, type LinkProps, type NavLinkProps } from "react-router-dom";

// ToolTrim uses declarative routing; eager framework route discovery is unused.
// Keep native anchors, router behavior and refs while avoiding repeated SSR markup.
export const Link = forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => (
  <RouterLink ref={ref} discover="none" {...props} />
));
Link.displayName = "Link";
export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>((props, ref) => (
  <RouterNavLink ref={ref} discover="none" {...props} />
));
NavLink.displayName = "NavLink";
export type { LinkProps, NavLinkProps };
