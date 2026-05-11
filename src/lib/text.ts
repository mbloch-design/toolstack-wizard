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

export function stripLeadingEmoji(value: unknown, fallback = ""): string {
  return asText(value, fallback).replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, "");
}
