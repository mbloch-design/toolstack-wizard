import type { HTMLAttributes, ReactNode } from "react";
import { useReveal } from "@/lib/useReveal";

/** A list item that arrives like the catalogue's cards (useReveal): for lists whose cards are not system cards. */
export default function RevealItem({ children, ...rest }: HTMLAttributes<HTMLLIElement> & { children: ReactNode }) {
  const reveal = useReveal<HTMLLIElement>();
  return <li ref={reveal} {...rest}>{children}</li>;
}
