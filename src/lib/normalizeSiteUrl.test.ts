import { describe, expect, it } from "vitest";
import { normalizeSiteUrl } from "./normalizeSiteUrl";

const url = (input: string) => {
  const result = normalizeSiteUrl(input);
  return result.ok ? result.url : `ERROR:${result.reason}`;
};

describe("normalizeSiteUrl", () => {
  it("adds the missing scheme", () => {
    expect(url("example.com")).toBe("https://example.com");
    expect(url("www.example.com/pricing")).toBe("https://www.example.com/pricing");
  });

  it("upgrades http to https", () => {
    expect(url("http://example.com")).toBe("https://example.com");
    expect(url("HTTP://Example.COM/Path")).toBe("https://example.com/Path");
  });

  it("keeps the path, query, and fragment", () => {
    expect(url("example.com/partners?plan=pro#badge")).toBe("https://example.com/partners?plan=pro#badge");
  });

  it("repairs common scheme typos", () => {
    expect(url("https:/example.com")).toBe("https://example.com");
    expect(url("https:\\\\example.com")).toBe("https://example.com");
    expect(url("//example.com")).toBe("https://example.com");
  });

  it("strips what people paste around an address", () => {
    expect(url("  example.com  ")).toBe("https://example.com");
    expect(url("<https://example.com>")).toBe("https://example.com");
    expect(url('"https://example.com"')).toBe("https://example.com");
    expect(url("@example.com")).toBe("https://example.com");
    // A whole sentence is not an address: reject rather than guess at the intent.
    expect(normalizeSiteUrl("Voici: https://example.com.").ok).toBe(false);
  });

  it("removes invisible characters left by copy-paste", () => {
    expect(url("https://example​.com")).toBe("https://example.com");
    expect(url("﻿example.com")).toBe("https://example.com");
    expect(url("example.com ")).toBe("https://example.com");
  });

  it("drops tracking parameters but keeps real ones", () => {
    // Once the last tracking parameter is gone the address is a bare homepage again.
    expect(url("example.com/?utm_source=x&utm_medium=y")).toBe("https://example.com");
    expect(url("example.com/?plan=pro&fbclid=123")).toBe("https://example.com/?plan=pro");
  });

  it("normalises casing and trailing dots in the hostname", () => {
    expect(url("EXAMPLE.COM")).toBe("https://example.com");
    expect(url("example.com.")).toBe("https://example.com");
  });

  it("strips default ports and rejects the others", () => {
    expect(url("http://example.com:80")).toBe("https://example.com");
    expect(url("https://example.com:443/x")).toBe("https://example.com/x");
    expect(url("https://example.com:8080")).toBe("ERROR:port_not_allowed");
  });

  it("rejects what cannot be a public website", () => {
    expect(url("")).toBe("ERROR:empty");
    expect(url("   ")).toBe("ERROR:empty");
    expect(url("localhost")).toBe("ERROR:invalid_hostname");
    expect(url("example")).toBe("ERROR:invalid_hostname");
    expect(url("mailto:hi@example.com")).toBe("ERROR:unsupported_scheme");
    expect(url("javascript:alert(1)")).toBe("ERROR:unsupported_scheme");
    expect(url("ftp://example.com")).toBe("ERROR:unsupported_scheme");
    expect(url("https://user:pass@example.com")).toBe("ERROR:malformed");
  });

  it("reports whether anything was rewritten", () => {
    const untouched = normalizeSiteUrl("https://example.com/partners");
    expect(untouched).toEqual({ ok: true, url: "https://example.com/partners", changed: false });
    const rewritten = normalizeSiteUrl("example.com");
    expect(rewritten.ok && rewritten.changed).toBe(true);
  });

  it("is stable when applied twice", () => {
    for (const input of ["example.com", "http://EXAMPLE.com:80/a?utm_source=x", "<example.com/b>"]) {
      const once = normalizeSiteUrl(input);
      expect(once.ok).toBe(true);
      if (!once.ok) return;
      expect(normalizeSiteUrl(once.url)).toEqual({ ok: true, url: once.url, changed: false });
    }
  });

  it("never throws on hostile input", () => {
    for (const input of [null, undefined, 42, "://", "https://", "h".repeat(5000), "%%%"]) {
      expect(() => normalizeSiteUrl(input)).not.toThrow();
    }
  });
});
