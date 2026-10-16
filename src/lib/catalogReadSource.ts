/** Public reads use the versioned catalogue unless remote refresh is explicitly enabled.
 * Changing this build-time setting requires a rebuild; it does not change admin access.
 */
export function catalogRemoteReadsEnabled(refreshRequested = true): boolean {
  return refreshRequested && import.meta.env.VITE_CATALOG_READ_SOURCE === "supabase";
}
