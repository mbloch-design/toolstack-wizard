export function asText(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const candidate = record.fr ?? record.en ?? record.name ?? record.label;
    if (candidate != null && candidate !== value) return asText(candidate, fallback);
    const firstText = Object.values(record).find((item) => typeof item === "string");
    if (firstText) return firstText;
  }
  return fallback;
}

/**
 * Removes the decorative emoji prefix carried by catalogue category names
 * ("✂️ Organisation" -> "Organisation").
 *
 * The pattern has to cover more than the pictograph itself, because most of
 * these emoji are multi-code-point sequences. "✂️" is U+2702 followed by U+FE0F
 * (variation selector); a pattern matching a single code point stripped only
 * U+2702 and left the selector plus its trailing space behind, which rendered
 * as a stray leading space. Variation selectors, skin-tone modifiers and the
 * zero-width joiner are all included for that reason.
 */
const LEADING_EMOJI = new RegExp(
  "^[" +
    "\\p{Emoji_Presentation}\\p{Extended_Pictographic}\\p{Emoji_Modifier}" +
    "\\uFE0E\\uFE0F" + // variation selectors (text / emoji presentation)
    "\\u200D" + // zero-width joiner
    "\\s" +
    "]+",
  "u",
);

export function stripLeadingEmoji(value: unknown, fallback = ""): string {
  return asText(value, fallback).replace(LEADING_EMOJI, "").trim();
}
