// @vitest-environment node
import { describe, expect, it } from "vitest";
import { validateDiagnosticEmailContent } from "../../../supabase/functions/_shared/email-quality";

describe("GO16 - Email restitution quality gate", () => {
  it("accepte un email transactionnel complet", () => {
    const ctaUrl = "https://tooltrim.com/results/demo-token";
    const result = validateDiagnosticEmailContent({
      subject: "Ton diagnostic ToolTrim est pret",
      html: `
        <main>
          <p>Bonjour, ton diagnostic ToolTrim est disponible avec une synthese claire.</p>
          <p>Tu peux consulter les economies, les risques et les actions prioritaires.</p>
          <a href="${ctaUrl}">Ouvrir mon rapport</a>
        </main>
      `,
      text: [
        "Bonjour, ton diagnostic ToolTrim est disponible avec une synthese claire.",
        "Tu peux consulter les economies, les risques et les actions prioritaires.",
        ctaUrl,
      ].join("\n"),
      ctaUrl,
    });

    expect(result.status).toBe("passed");
    expect(result.score).toBe(100);
    expect(result.flags).toHaveLength(0);
  });

  it("bloque un email sans CTA valide", () => {
    const result = validateDiagnosticEmailContent({
      subject: "Rapport",
      html: "<p>Ton rapport est pret.</p>",
      text: "Ton rapport est pret.",
      ctaUrl: "tooltrim/results",
    });

    expect(result.status).toBe("failed");
    expect(result.flags.map((flag) => flag.id)).toEqual(
      expect.arrayContaining(["subject_too_short", "html_body_too_short", "cta_invalid"])
    );
  });

  it("bloque les placeholders non resolus", () => {
    const ctaUrl = "https://tooltrim.com/results/demo-token";
    const result = validateDiagnosticEmailContent({
      subject: "Diagnostic pour undefined",
      html: `<p>Bonjour undefined, ton rapport est disponible.</p><a href="${ctaUrl}">Voir</a>`,
      text: `Bonjour undefined, ton rapport est disponible.\n${ctaUrl}`,
      ctaUrl,
    });

    expect(result.status).toBe("failed");
    expect(result.metrics.unresolved_placeholder_count).toBeGreaterThan(0);
    expect(result.flags.map((flag) => flag.id)).toContain("unresolved_placeholder");
  });
});
