/**
 * Maintenance uses the same SEED_ADMIN_KEY / x-admin-key contract as the
 * existing seed functions. A user JWT or public API key cannot authorize it.
 */
export function requireMaintenanceAccess(
  request: Request,
  expectedKey: string | undefined,
  corsHeaders: Record<string, string>,
): Response | null {
  const deny = (status: number, error: string) => new Response(JSON.stringify({ error }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...(status === 405 ? { Allow: "POST, OPTIONS" } : {}) },
  });

  if (request.method !== "POST") return deny(405, "Method not allowed");
  if (!expectedKey) return deny(503, "Maintenance unavailable");
  const providedKey = request.headers.get("x-admin-key");
  if (!providedKey) return deny(401, "Unauthorized");
  if (providedKey !== expectedKey) return deny(403, "Forbidden");
  return null;
}
