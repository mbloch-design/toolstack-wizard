import { useState } from "react";
import toolsV10 from "@/data/tools_v10.json";
import verticalsJson from "@/data/verticals.json";
import pricingCsv from "@/data/pricing_truth.csv?raw";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

function parseCsvPrices(csv: string): Record<string, number> {
  const lines = csv.trim().split("\n");
  const headers = lines[0].split(",");
  const idIdx = headers.indexOf("id");
  const priceIdx = headers.indexOf("compare_price_monthly_eur");
  const prices: Record<string, number> = {};
  for (let i = 1; i < lines.length; i++) {
    // Simple CSV parse (handles quoted fields)
    const cols = lines[i].match(/(".*?"|[^,]+)(?=,|$)/g) || [];
    const id = cols[idIdx]?.replace(/"/g, "").trim();
    const price = parseFloat(cols[priceIdx]?.replace(/"/g, "").trim());
    if (id && !isNaN(price)) prices[id] = price;
  }
  return prices;
}

export default function UpdateToolsV10() {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSeed = async () => {
    setLoading(true);
    setStatus("Parsing CSV prices...");

    const priceOverrides = parseCsvPrices(pricingCsv);
    setStatus(`Found ${Object.keys(priceOverrides).length} price overrides from CSV. Seeding...`);

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/seed-tools-v4`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": "unikas",
        },
        body: JSON.stringify({
          tools: toolsV10,
          verticals: verticalsJson,
          priceOverrides,
        }),
      });

      const data = await res.json();
      setStatus(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="font-heading text-2xl font-bold">Seed V10 Data</h1>
        <p className="text-sm text-muted-foreground">
          Seeds {(toolsV10 as any[]).length} tools from V10 JSON with CSV price overrides.
          Includes prescription_quality, prescription_output, substitution_cluster_v2.
        </p>

        <button
          onClick={handleSeed}
          disabled={loading}
          className="rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Seeding..." : "Seed V10 Tools + Verticals"}
        </button>

        {status && (
          <pre className="rounded-xl border border-border bg-card p-4 text-xs overflow-auto max-h-96 whitespace-pre-wrap">
            {status}
          </pre>
        )}
      </div>
    </div>
  );
}
