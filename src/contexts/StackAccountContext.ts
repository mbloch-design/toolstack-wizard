import { createContext, useContext } from "react";
import type { StackAccountContext } from "@/hooks/useStackAccount";

// Keep reading the account snapshot independent from loading the Auth client.
export const StackAccountReactContext = createContext<StackAccountContext | null>(null);
export function useOptionalStackAccount() { return useContext(StackAccountReactContext); }
