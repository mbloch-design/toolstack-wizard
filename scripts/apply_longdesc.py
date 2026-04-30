#!/usr/bin/env python3
"""
Apply long descriptions directly to Supabase.
Usage:
    SUPABASE_SERVICE_ROLE_KEY="eyJ..." python3 scripts/apply_longdesc.py
"""
import json, os, sys, time
import httpx

SUPABASE_URL = "https://rtfyfuwfdpnsogovkwai.supabase.co"

PERSONA_LABELS_FR = {
    "freelance-generalist": "freelances généralistes",
    "consultant-b2b": "consultants B2B",
    "fondateur-saas": "fondateurs SaaS",
    "createur-contenu": "créateurs de contenu",
    "designer-independant": "designers indépendants",
    "developpeur-independant": "développeurs indépendants",
    "developpeur-solo": "développeurs solo",
    "photographe-videaste": "photographes et vidéastes",
    "redacteur-traducteur": "rédacteurs et traducteurs",
    "coach-formateur": "coachs et formateurs",
    "graphiste-da": "graphistes",
    "motion-video": "créateurs vidéo",
    "photographe": "photographes",
    "newslettiste-auteur": "auteurs et newslettistes",
    "ux-ui": "designers UX/UI",
    "ecommercant": "e-commerçants",
    "podcasteur": "podcasteurs",
    "cto-lead-tech": "CTOs et leads tech",
    "product-manager": "product managers",
    "community-manager": "community managers",
    "ai-builder": "builders IA",
    "data-analyst": "data analysts",
    "rh-recruteur": "RH et recruteurs",
    "daf-finance": "DAF et responsables finance",
    "manager-dsi": "managers et DSI",
    "architecte-bim": "architectes BIM",
    "illustrateur": "illustrateurs",
    "scenographe": "scénographes",
}

PERSONA_LABELS_EN = {
    "freelance-generalist": "generalist freelancers",
    "consultant-b2b": "B2B consultants",
    "fondateur-saas": "SaaS founders",
    "createur-contenu": "content creators",
    "designer-independant": "independent designers",
    "developpeur-independant": "independent developers",
    "developpeur-solo": "solo developers",
    "photographe-videaste": "photographers and videographers",
    "redacteur-traducteur": "writers and translators",
    "coach-formateur": "coaches and trainers",
    "graphiste-da": "graphic designers",
    "motion-video": "video creators",
    "photographe": "photographers",
    "newslettiste-auteur": "writers and newsletter creators",
    "ux-ui": "UX/UI designers",
    "ecommercant": "e-commerce sellers",
    "podcasteur": "podcasters",
    "cto-lead-tech": "CTOs and tech leads",
    "product-manager": "product managers",
    "community-manager": "community managers",
    "ai-builder": "AI builders",
    "data-analyst": "data analysts",
    "rh-recruteur": "HR and recruiters",
    "daf-finance": "CFOs and finance managers",
    "manager-dsi": "managers and IT directors",
    "architecte-bim": "BIM architects",
    "illustrateur": "illustrators",
    "scenographe": "set designers",
}

def lc(s):
    if not s: return s
    return s[0].lower() + s[1:]

def uc(s):
    if not s: return s
    return s[0].upper() + s[1:]

def price_str(tool, lang='fr'):
    price = tool.get('default_monthly_price') or 0
    if price == 0:
        pricing = tool.get('pricing') or {}
        if isinstance(pricing, dict) and pricing.get('paid'):
            return ("gratuit_freemium", "free_freemium")[lang == 'en']
        return ("gratuit", "free")[lang == 'en']
    return (f"{price}€/mois", f"€{price}/month")[lang == 'en']

def build_fr(tool):
    name = tool['name']
    short = (tool.get('short_description') or '').strip().rstrip('.')
    pros = tool.get('pros') or []
    cons = tool.get('cons') or []
    use_cases = tool.get('use_cases') or []
    verdict = tool.get('verdict') or {}
    keep_if = verdict.get('keepIf') or []
    avoid_if = verdict.get('avoidIf') or []
    threshold = (verdict.get('threshold') or '').strip()
    fa = tool.get('free_alternative') or ''
    free_alt = fa if isinstance(fa, str) else (fa.get('tool') or '') if isinstance(fa, dict) else ''
    ba = tool.get('better_alternative') or ''
    better_alt = ba if isinstance(ba, str) else (ba.get('tool') or '') if isinstance(ba, dict) else ''
    price = price_str(tool, 'fr')
    verticals = tool.get('verticals') or []
    time_gain = tool.get('time_gained_hours_per_month') or 0
    paragraphs = []

    # § 1 — Accroche
    p1 = []
    if short:
        p1.append(f"{name}, c'est {lc(short)}.")
    if price == "gratuit_freemium":
        p1.append("Gratuit pour commencer, payant pour aller plus loin.")
    elif price == "gratuit":
        p1.append("Entièrement gratuit.")
    else:
        p1.append(f"À partir de {price}.")
    if verticals:
        labels = [PERSONA_LABELS_FR.get(v) for v in verticals[:2] if PERSONA_LABELS_FR.get(v)]
        if labels:
            p1.append(f"Pensé pour les {' et les '.join(labels)}.")
    paragraphs.append(' '.join(p1))

    # § 2 — Atouts en prose naturelle
    p2 = []
    if pros:
        if len(pros) == 1:
            p2.append(f"Son point fort : {lc(pros[0]).rstrip('.')}.")
        elif len(pros) == 2:
            p2.append(f"{uc(pros[0]).rstrip('.')}, et {lc(pros[1]).rstrip('.')}.")
        else:
            p2.append(f"{uc(pros[0]).rstrip('.')}.")
            extras = [lc(p).rstrip('.') for p in pros[1:3]]
            p2.append(f"{', '.join(extras)}.")
            if len(pros) > 3:
                p2.append(f"{uc(pros[3]).rstrip('.')}.")
    if use_cases:
        p2.append(f"Concrètement : {lc(use_cases[0]).rstrip('.')}.")
        if len(use_cases) > 1:
            p2.append(f"Ou encore : {lc(use_cases[1]).rstrip('.')}.")
    if time_gain > 0:
        p2.append(f"Gain de temps estimé : {time_gain}h/mois.")
    if p2:
        paragraphs.append(' '.join(p2))

    # § 3 — Verdict
    p3 = []
    if keep_if:
        items = [lc(k).rstrip('.') for k in keep_if[:2]]
        p3.append(f"À garder si : {' ou '.join(items)}.")
    if avoid_if:
        items = [lc(a).rstrip('.') for a in avoid_if[:2]]
        p3.append(f"À éviter si : {' ou '.join(items)}.")
    if cons:
        p3.append(f"Limite principale : {lc(cons[0]).rstrip('.')}.")
    if threshold:
        p3.append(threshold.rstrip('.') + '.')
    if free_alt:
        p3.append(f"Alternative gratuite : {free_alt}.")
    if better_alt and better_alt != free_alt:
        p3.append(f"Si le budget le permet, {better_alt} va plus loin.")
    if p3:
        paragraphs.append(' '.join(p3))

    return '\n\n'.join(paragraphs)


def build_en(tool):
    name = tool['name']
    short_en = (tool.get('short_description_en') or '').strip().rstrip('.')
    pros = tool.get('pros_en') or []
    cons = tool.get('cons_en') or []
    use_cases = tool.get('use_cases_en') or []
    verdict = tool.get('verdict_en') or {}
    if not verdict:
        keep_if = []; avoid_if = []; threshold = ''
    else:
        keep_if = verdict.get('keepIf') or []
        avoid_if = verdict.get('avoidIf') or []
        threshold = (verdict.get('threshold') or '').strip()
    fa = tool.get('free_alternative') or ''
    free_alt = fa if isinstance(fa, str) else (fa.get('tool') or '') if isinstance(fa, dict) else ''
    ba = tool.get('better_alternative') or ''
    better_alt = ba if isinstance(ba, str) else (ba.get('tool') or '') if isinstance(ba, dict) else ''
    price = price_str(tool, 'en')
    verticals = tool.get('verticals') or []
    time_gain = tool.get('time_gained_hours_per_month') or 0
    paragraphs = []

    # § 1
    p1 = []
    if short_en:
        p1.append(f"{name} is {lc(short_en)}.")
    else:
        p1.append(f"{name} is a tool for freelancers and independent professionals.")
    if price == "free_freemium":
        p1.append("Free to start, paid plans for more.")
    elif price == "free":
        p1.append("Completely free.")
    else:
        p1.append(f"Starting at {price}.")
    if verticals:
        labels = [PERSONA_LABELS_EN.get(v) for v in verticals[:2] if PERSONA_LABELS_EN.get(v)]
        if labels:
            p1.append(f"Built for {' and '.join(labels)}.")
    paragraphs.append(' '.join(p1))

    # § 2
    p2 = []
    if pros:
        if len(pros) == 1:
            p2.append(f"Its main strength: {lc(pros[0]).rstrip('.')}.")
        elif len(pros) == 2:
            p2.append(f"{uc(pros[0]).rstrip('.')}, and {lc(pros[1]).rstrip('.')}.")
        else:
            p2.append(f"{uc(pros[0]).rstrip('.')}.")
            extras = [lc(p).rstrip('.') for p in pros[1:3]]
            p2.append(f"{', '.join(extras)}.")
            if len(pros) > 3:
                p2.append(f"{uc(pros[3]).rstrip('.')}.")
    if use_cases:
        p2.append(f"In practice: {lc(use_cases[0]).rstrip('.')}.")
        if len(use_cases) > 1:
            p2.append(f"Also: {lc(use_cases[1]).rstrip('.')}.")
    if time_gain > 0:
        p2.append(f"Estimated time saving: {time_gain}h/month.")
    if p2:
        paragraphs.append(' '.join(p2))

    # § 3
    p3 = []
    if keep_if:
        items = [lc(k).rstrip('.') for k in keep_if[:2]]
        p3.append(f"Keep it if: {' or '.join(items)}.")
    if avoid_if:
        items = [lc(a).rstrip('.') for a in avoid_if[:2]]
        p3.append(f"Skip it if: {' or '.join(items)}.")
    if cons:
        p3.append(f"Main limit: {lc(cons[0]).rstrip('.')}.")
    if threshold:
        p3.append(threshold.rstrip('.') + '.')
    if free_alt:
        p3.append(f"Free alternative: {free_alt}.")
    if better_alt and better_alt != free_alt:
        p3.append(f"If budget allows, {better_alt} goes further.")
    if p3:
        paragraphs.append(' '.join(p3))

    return '\n\n'.join(paragraphs)


def main():
    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not service_key:
        print("ERROR: Set SUPABASE_SERVICE_ROLE_KEY", file=sys.stderr)
        sys.exit(1)

    tools_path = os.path.join(os.path.dirname(__file__), '..', 'tools_full_usable.json')
    if not os.path.exists(tools_path):
        tools_path = '/tmp/tools_full_usable.json'

    tools = json.load(open(tools_path))
    print(f"Loaded {len(tools)} tools")

    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }

    ok = 0
    errors = []

    for i, tool in enumerate(tools):
        slug = tool.get('slug', '')
        fr = build_fr(tool)
        en = build_en(tool)
        if not fr:
            continue

        print(f"[{i+1}/{len(tools)}] {slug}...", end=" ", flush=True)

        try:
            r = httpx.patch(
                f"{SUPABASE_URL}/rest/v1/tools?slug=eq.{slug}",
                json={"long_description": fr, "long_description_en": en},
                headers=headers,
                timeout=15,
            )
            r.raise_for_status()
            print("ok")
            ok += 1
            time.sleep(0.05)
        except Exception as e:
            print(f"ERROR: {e}")
            errors.append(slug)
            time.sleep(1)

    print(f"\nDone: {ok} updated, {len(errors)} errors")
    if errors:
        print(f"Failed: {', '.join(errors)}")


if __name__ == "__main__":
    main()
