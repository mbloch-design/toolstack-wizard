import { afterEach, expect, it, vi } from "vitest";
import { httpFixture } from "./http";
import contributions from "../../api/backoffice-contributions";

afterEach(() => vi.unstubAllEnvs());

it("closes the admin review queue and mixed release actions while the CMS is disabled", async () => {
  vi.stubEnv("PUBLISHER_CMS_ENABLED", "false");
  for (const method of ["GET", "POST"]) {
    const fixture = httpFixture(undefined, method);
    await contributions(fixture.req, fixture.res);
    expect(fixture.res.statusCode).toBe(503);
    expect(fixture.body).toEqual({ error: { code: "CMS_DISABLED" } });
  }
});
