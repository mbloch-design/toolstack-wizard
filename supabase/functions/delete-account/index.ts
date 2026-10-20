// Intentionally disabled. Personal deletion is exclusively handled by the
// verified-session, deletion-barrier and history-protected /api/stack-account.
// Keep this dormant source from becoming an alternative privileged bypass.
Deno.serve(async () => new Response(JSON.stringify({ error: "LEGACY_ACCOUNT_DELETION_DISABLED" }), {
  status: 410,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
}));
