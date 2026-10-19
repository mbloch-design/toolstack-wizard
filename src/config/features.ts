// Explicit activation for isolated acceptance; public builds stay disabled by default.
// The server independently requires STACK_ACCOUNT_ENABLED=true.
export const STACK_ACCOUNT_ENABLED = import.meta.env.VITE_STACK_ACCOUNT_ENABLED === "true";
