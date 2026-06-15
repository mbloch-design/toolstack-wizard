export type DiagnosticEmailQualityStatus = "passed" | "warning" | "failed";
export type DiagnosticEmailQualitySeverity = "warning" | "error";

export type DiagnosticEmailQualityFlag = {
  id: string;
  severity: DiagnosticEmailQualitySeverity;
  label: string;
  detail: string;
};

export type DiagnosticEmailQualityResult = {
  status: DiagnosticEmailQualityStatus;
  score: number;
  flags: DiagnosticEmailQualityFlag[];
  metrics: {
    subject_length: number;
    html_length: number;
    text_length: number;
    cta_present: boolean;
    cta_valid: boolean;
    unresolved_placeholder_count: number;
  };
};

export type DiagnosticEmailQualityInput = {
  subject?: string | null;
  html?: string | null;
  text?: string | null;
  ctaUrl?: string | null;
};

const PLACEHOLDER_PATTERN = /\b(undefined|null|nan)\b|\[object Object\]/gi;

function pushFlag(
  flags: DiagnosticEmailQualityFlag[],
  id: string,
  severity: DiagnosticEmailQualitySeverity,
  label: string,
  detail: string
) {
  flags.push({ id, severity, label, detail });
}

function hasValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function countUnresolvedPlaceholders(parts: string[]) {
  return parts.reduce((sum, part) => {
    const matches = part.match(PLACEHOLDER_PATTERN);
    return sum + (matches?.length || 0);
  }, 0);
}

export function validateDiagnosticEmailContent(
  input: DiagnosticEmailQualityInput
): DiagnosticEmailQualityResult {
  const subject = (input.subject || "").trim();
  const html = (input.html || "").trim();
  const text = (input.text || "").trim();
  const ctaUrl = (input.ctaUrl || "").trim();
  const flags: DiagnosticEmailQualityFlag[] = [];
  const unresolvedPlaceholderCount = countUnresolvedPlaceholders([subject, html, text, ctaUrl]);
  const ctaValid = ctaUrl.length > 0 && hasValidUrl(ctaUrl);

  if (subject.length < 8) {
    pushFlag(flags, "subject_too_short", "error", "Subject too short", "The email subject is missing or too short.");
  } else if (subject.length > 110) {
    pushFlag(flags, "subject_too_long", "warning", "Subject too long", "The email subject may be truncated in inboxes.");
  }

  if (html.length < 160) {
    pushFlag(flags, "html_body_too_short", "error", "HTML body too short", "The HTML body does not contain enough content.");
  }

  if (text.length < 80) {
    pushFlag(flags, "text_body_too_short", "warning", "Text body too short", "The plain-text fallback is too thin.");
  }

  if (!ctaUrl) {
    pushFlag(flags, "cta_missing", "error", "CTA missing", "No destination URL was generated for this email.");
  } else if (!ctaValid) {
    pushFlag(flags, "cta_invalid", "error", "CTA invalid", "The destination URL is not a valid HTTP(S) URL.");
  } else {
    if (!html.includes(ctaUrl)) {
      pushFlag(flags, "html_cta_not_found", "warning", "CTA absent from HTML", "The HTML body does not include the CTA URL.");
    }
    if (!text.includes(ctaUrl)) {
      pushFlag(flags, "text_cta_not_found", "warning", "CTA absent from text", "The plain-text body does not include the CTA URL.");
    }
  }

  if (html && !/<a\s/i.test(html)) {
    pushFlag(flags, "html_link_missing", "warning", "HTML link missing", "The HTML body has no visible link element.");
  }

  if (unresolvedPlaceholderCount > 0) {
    pushFlag(
      flags,
      "unresolved_placeholder",
      "error",
      "Unresolved placeholder",
      "The email still contains unresolved values such as undefined, null, NaN, or [object Object]."
    );
  }

  const errorCount = flags.filter((flag) => flag.severity === "error").length;
  const warningCount = flags.length - errorCount;
  const score = Math.max(0, 100 - errorCount * 35 - warningCount * 10);

  return {
    status: errorCount > 0 ? "failed" : warningCount > 0 ? "warning" : "passed",
    score,
    flags,
    metrics: {
      subject_length: subject.length,
      html_length: html.length,
      text_length: text.length,
      cta_present: ctaUrl.length > 0,
      cta_valid: ctaValid,
      unresolved_placeholder_count: unresolvedPlaceholderCount,
    },
  };
}

export function summarizeDiagnosticEmailQuality(result: DiagnosticEmailQualityResult) {
  return {
    status: result.status,
    score: result.score,
    flag_count: result.flags.length,
    error_count: result.flags.filter((flag) => flag.severity === "error").length,
    warning_count: result.flags.filter((flag) => flag.severity === "warning").length,
    flag_ids: result.flags.map((flag) => flag.id),
  };
}
