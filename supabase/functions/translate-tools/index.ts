import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function translateWithAI(
  text: string,
  apiKey: string,
  context: string
): Promise<string> {
  const res = await fetch(
    "https://ai.gateway.lovable.dev/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a professional translator from French to English for a SaaS tools comparison website. Translate accurately and naturally. Keep brand names, tool names, and technical terms unchanged. ${context}. Return ONLY the translation, no explanations.`,
          },
          { role: "user", content: text },
        ],
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`AI Gateway error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

async function translateJsonArray(
  arr: string[],
  apiKey: string,
  context: string
): Promise<string[]> {
  if (!arr || arr.length === 0) return [];
  // Batch all items in one call for efficiency
  const prompt = arr.map((item, i) => `[${i}] ${item}`).join("\n");
  const result = await translateWithAI(
    prompt,
    apiKey,
    `${context}. Each line starts with [N]. Translate each line keeping the [N] prefix.`
  );
  // Parse numbered lines back
  const lines = result.split("\n").filter((l) => l.trim());
  const translated: string[] = [];
  for (let i = 0; i < arr.length; i++) {
    const line = lines.find((l) => l.startsWith(`[${i}]`));
    translated.push(line ? line.replace(/^\[\d+\]\s*/, "").trim() : arr[i]);
  }
  return translated;
}

async function translateVerdict(
  verdict: any,
  apiKey: string
): Promise<any> {
  if (!verdict) return null;
  const result: any = {};

  if (verdict.threshold) {
    result.threshold = await translateWithAI(
      verdict.threshold,
      apiKey,
      "This is a verdict threshold statement about when a tool is worth paying for"
    );
  }
  if (verdict.keepIf && Array.isArray(verdict.keepIf)) {
    result.keepIf = await translateJsonArray(
      verdict.keepIf,
      apiKey,
      "These are reasons to keep using a tool"
    );
  }
  if (verdict.avoidIf && Array.isArray(verdict.avoidIf)) {
    result.avoidIf = await translateJsonArray(
      verdict.avoidIf,
      apiKey,
      "These are reasons to avoid a tool"
    );
  }
  return result;
}

async function translatePricing(
  pricing: any,
  apiKey: string
): Promise<any> {
  if (!pricing) return null;
  const result: any = {};

  if (pricing.free) {
    result.free = await translateWithAI(
      pricing.free,
      apiKey,
      "This is a description of the free tier of a SaaS tool"
    );
  }
  if (pricing.paid) {
    result.paid = await translateWithAI(
      pricing.paid,
      apiKey,
      "This is a description of the paid tier of a SaaS tool"
    );
  }
  // Keep numeric fields as-is
  if (pricing.price !== undefined) result.price = pricing.price;
  if (pricing.currency) result.currency = pricing.currency;

  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check - require admin key
    const authHeader = req.headers.get("authorization");
    const seedKey = Deno.env.get("SEED_ADMIN_KEY");
    if (!seedKey || !authHeader || authHeader !== `Bearer ${seedKey}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse optional params
    const body = await req.json().catch(() => ({}));
    const limit = body.limit || 10; // process N tools per call
    const toolId = body.tool_id || null; // optional: translate a single tool

    // Fetch tools that need translation (no EN description yet)
    let query = supabase
      .from("tools")
      .select("id, name, short_description, long_description, pros, cons, use_cases, verdict, pricing")
      .is("short_description_en", null);

    if (toolId) {
      query = query.eq("id", toolId);
    }

    const { data: tools, error: fetchErr } = await query.limit(limit);
    if (fetchErr) throw new Error(`Fetch error: ${fetchErr.message}`);
    if (!tools || tools.length === 0) {
      return new Response(
        JSON.stringify({ message: "No tools to translate", translated: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: { id: string; name: string; status: string }[] = [];

    for (const tool of tools) {
      try {
        console.log(`Translating: ${tool.name} (${tool.id})`);

        const updates: Record<string, any> = {};

        // Short description
        if (tool.short_description) {
          updates.short_description_en = await translateWithAI(
            tool.short_description,
            LOVABLE_API_KEY,
            `Short description for the tool "${tool.name}"`
          );
        }

        // Long description
        if (tool.long_description) {
          updates.long_description_en = await translateWithAI(
            tool.long_description,
            LOVABLE_API_KEY,
            `Detailed description for the tool "${tool.name}"`
          );
        }

        // Pros
        if (tool.pros && Array.isArray(tool.pros) && tool.pros.length > 0) {
          updates.pros_en = await translateJsonArray(
            tool.pros,
            LOVABLE_API_KEY,
            `Advantages/pros of the tool "${tool.name}"`
          );
        }

        // Cons
        if (tool.cons && Array.isArray(tool.cons) && tool.cons.length > 0) {
          updates.cons_en = await translateJsonArray(
            tool.cons,
            LOVABLE_API_KEY,
            `Disadvantages/cons of the tool "${tool.name}"`
          );
        }

        // Use cases
        if (tool.use_cases && Array.isArray(tool.use_cases) && tool.use_cases.length > 0) {
          updates.use_cases_en = await translateJsonArray(
            tool.use_cases,
            LOVABLE_API_KEY,
            `Use cases for the tool "${tool.name}"`
          );
        }

        // Verdict
        if (tool.verdict) {
          updates.verdict_en = await translateVerdict(
            tool.verdict,
            LOVABLE_API_KEY
          );
        }

        // Pricing
        if (tool.pricing) {
          updates.pricing_en = await translatePricing(
            tool.pricing,
            LOVABLE_API_KEY
          );
        }

        // Update DB
        const { error: updateErr } = await supabase
          .from("tools")
          .update(updates)
          .eq("id", tool.id);

        if (updateErr) throw new Error(`Update error: ${updateErr.message}`);

        results.push({ id: tool.id, name: tool.name, status: "ok" });
        console.log(`✅ ${tool.name} translated`);

        // Small delay between tools to avoid rate limits
        await new Promise((r) => setTimeout(r, 2000));
      } catch (toolErr) {
        console.error(`❌ ${tool.name}: ${toolErr}`);
        results.push({
          id: tool.id,
          name: tool.name,
          status: `error: ${toolErr}`,
        });
      }
    }

    return new Response(
      JSON.stringify({
        translated: results.filter((r) => r.status === "ok").length,
        errors: results.filter((r) => r.status !== "ok").length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("translate-tools error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
