#!/usr/bin/env python3
"""
Translate missing English descriptions for ToolTrim tools in Supabase.

Usage:
    pip install anthropic httpx
    export ANTHROPIC_API_KEY="sk-ant-..."
    export SUPABASE_SERVICE_ROLE_KEY="eyJ..."  # from Supabase dashboard > Settings > API
    python scripts/translate_en_descriptions.py

Options:
    --dry-run    Print SQL only, don't update Supabase
    --limit N    Process only N tools (default: all)
    --slug SLUG  Process a single tool by slug
"""

import os
import sys
import json
import time
import argparse
import httpx
import anthropic

SUPABASE_URL = "https://rtfyfuwfdpnsogovkwai.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0ZnlmdXdmZHBuc29nb3Zrd2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyOTcyMDcsImV4cCI6MjA4ODg3MzIwN30.pwpmh9Qe8dLZFq1rMqtCRmEMJ9dnbcdvT_B4CjIu4Xc"


def supabase_get(path: str, key: str) -> list:
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    r = httpx.get(url, headers={"apikey": key, "Authorization": f"Bearer {key}"}, timeout=30)
    r.raise_for_status()
    return r.json()


def supabase_patch(table: str, row_id: str, data: dict, service_key: str):
    url = f"{SUPABASE_URL}/rest/v1/{table}?id=eq.{row_id}"
    r = httpx.patch(
        url,
        json=data,
        headers={
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        },
        timeout=30,
    )
    r.raise_for_status()


def translate_tool(client: anthropic.Anthropic, tool: dict) -> dict:
    """Return dict with short_description_en and long_description_en."""
    slug = tool.get("slug", tool.get("id", ""))
    name = tool.get("name", slug)
    short_fr = (tool.get("short_description") or "").strip()
    long_fr = (tool.get("long_description") or "").strip()

    if not short_fr and not long_fr:
        return {}

    prompt = f"""Translate the following SaaS tool descriptions from French to English.
Tool: {name} (slug: {slug})

Rules:
- Keep the same tone (concise, direct, freelance-focused)
- Preserve all prices and numbers exactly (e.g. "12€/mois" → "€12/month")
- Do NOT add information that isn't in the French text
- Return ONLY valid JSON with keys "short" and "long"

French short description:
{short_fr}

French long description:
{long_fr if long_fr else "(none)"}

JSON:"""

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()
    # Strip markdown code block if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    parsed = json.loads(raw)
    result = {}
    if parsed.get("short"):
        result["short_description_en"] = parsed["short"].strip()
    if parsed.get("long") and long_fr:
        result["long_description_en"] = parsed["long"].strip()
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Print SQL, don't write to Supabase")
    parser.add_argument("--limit", type=int, default=0, help="Max tools to process")
    parser.add_argument("--slug", type=str, default="", help="Process single slug")
    args = parser.parse_args()

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not api_key:
        print("ERROR: Set ANTHROPIC_API_KEY environment variable", file=sys.stderr)
        sys.exit(1)

    if not args.dry_run and not service_key:
        print("ERROR: Set SUPABASE_SERVICE_ROLE_KEY or use --dry-run", file=sys.stderr)
        sys.exit(1)

    # Fetch tools missing EN descriptions
    print("Fetching tools from Supabase...")
    if args.slug:
        tools = supabase_get(
            f"tools?slug=eq.{args.slug}&select=id,slug,name,short_description,long_description,short_description_en,long_description_en",
            ANON_KEY,
        )
    else:
        tools = supabase_get(
            "tools?select=id,slug,name,short_description,long_description,short_description_en,long_description_en&limit=500",
            ANON_KEY,
        )

    # Filter only those missing EN short description
    missing = [
        t for t in tools
        if not (t.get("short_description_en") or "").strip()
        and (t.get("short_description") or "").strip()
    ]

    if args.limit:
        missing = missing[: args.limit]

    print(f"Found {len(missing)} tools to translate\n")

    client = anthropic.Anthropic(api_key=api_key)
    sql_lines = []
    errors = []

    for i, tool in enumerate(missing):
        slug = tool.get("slug", tool.get("id", ""))
        print(f"[{i+1}/{len(missing)}] Translating {slug}...", end=" ", flush=True)

        try:
            translations = translate_tool(client, tool)
            if not translations:
                print("skip (no FR text)")
                continue

            # Build SQL for dry-run output
            sets = ", ".join(
                f"{k} = $${v}$$" for k, v in translations.items()
            )
            sql_lines.append(f"UPDATE tools SET {sets} WHERE slug = '{slug}';")

            if not args.dry_run:
                supabase_patch("tools", tool["id"], translations, service_key)
                print(f"updated ({len(translations)} fields)")
            else:
                print(f"dry-run ok ({len(translations)} fields)")

            # Respect rate limits
            time.sleep(0.3)

        except json.JSONDecodeError as e:
            print(f"JSON parse error: {e}")
            errors.append(slug)
        except Exception as e:
            print(f"ERROR: {e}")
            errors.append(slug)
            time.sleep(1)

    # Write SQL file
    if sql_lines:
        sql_path = "scripts/translations_output.sql"
        with open(sql_path, "w") as f:
            f.write("-- Auto-generated EN translations for ToolTrim tools\n")
            f.write("-- Run in Supabase SQL editor if needed\n\n")
            f.write("\n".join(sql_lines))
            f.write("\n")
        print(f"\nSQL written to {sql_path}")

    if errors:
        print(f"\nFailed slugs ({len(errors)}): {', '.join(errors)}")
        print("Re-run with --slug <slug> to retry individually")

    print(f"\nDone. {len(sql_lines)} tools translated, {len(errors)} errors.")


if __name__ == "__main__":
    main()
