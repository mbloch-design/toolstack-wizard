import { render, cleanup } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import ToolJsonLd from "./ToolJsonLd";
import { mapToolFromJson } from "@/lib/toolFromJson";
afterEach(cleanup);
it("does not regenerate a free structured offer from stale free prose when explicit price intent is unknown", () => {
  const tool = mapToolFromJson({
    id: "status-jsonld",
    slug: "status-jsonld",
    name: "Status",
    pricing: { free: "Free plan forever", paid: "Paid" },
    pricing_v5: {
      plans: [
        {
          planKey: "enterprise",
          displayName: "Enterprise",
          nativeAmount: null,
          nativeCurrency: "EUR",
          isFree: false,
          isComparePlan: false,
          priceStatus: "unknown",
        },
      ],
    },
  });
  render(
    <ToolJsonLd
      category={undefined}
      tool={tool}
      displayPrice={0}
      verifiedOn=""
      alternatives={[]}
      lang="fr"
    />,
  );
  const data = JSON.parse(
    document.querySelector("#tool-software-jsonld")?.textContent || "{}",
  );
  expect(data).not.toHaveProperty("offers");
});
