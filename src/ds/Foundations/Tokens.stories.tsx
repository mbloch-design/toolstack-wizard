import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Check, Pencil, Plus, Search } from "@/lib/icons";

const meta: Meta = { title: "Fondations/Jetons", tags: ["a-valider"] };
export default meta;
type Story = StoryObj;

const label: CSSProperties = { font: "var(--tt-note-font)", letterSpacing: "var(--tt-note-tracking)", color: "var(--tt-ink)" };
const code: CSSProperties = label;
const Grid = ({ children, min = 180 }: { children: ReactNode; min?: number }) => <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${min}px, 1fr))`, gap: 16 }}>{children}</div>;

/** Reads a token's computed value, so the page always shows what the system really uses. */
function useToken(ref: React.RefObject<HTMLElement | null>, name: string) {
  const [value, setValue] = useState("");
  useEffect(() => { if (ref.current) setValue(getComputedStyle(ref.current).getPropertyValue(name).trim()); });
  return value;
}

// Relative luminance and WCAG contrast from a computed rgb() colour.
// Any CSS colour (oklch, color-mix…) to sRGB pixels through a canvas.
const rgb = (c: string) => { const ctx = document.createElement("canvas").getContext("2d")!; ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1); return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3); };
const lum = (c: string) => { const [r, g, b] = rgb(c).map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

function Swatch({ name, on = "--tt-bg" }: { name: string; on?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [info, setInfo] = useState({ value: "", contrast: 0 });
  useEffect(() => {
    if (!ref.current) return;
    const swatch = ref.current.firstElementChild as HTMLElement; const ground = ref.current;
    const c = getComputedStyle(swatch).backgroundColor, g = getComputedStyle(ground).backgroundColor;
    setInfo({ value: getComputedStyle(ref.current).getPropertyValue(name).trim(), contrast: ratio(c, g) });
  }, [name]);
  return <div ref={ref} style={{ display: "grid", gap: 8, padding: 12, borderRadius: 16, background: `var(${on})` }}>
    <div style={{ height: 56, borderRadius: 10, background: `var(${name})`, boxShadow: "var(--tt-hairline)" }} />
    <span style={label}>{name}</span>
    <span style={code}>{info.value}</span>
    <span style={code}>{info.contrast.toFixed(2)}:1 {on === "--tt-bg" ? "sur le fond" : "sur la tuile"}</span>
  </div>;
}

/** Surfaces, ink and meaning, with their contrast against the page and the tile. Switch the theme in the toolbar. */
export const Couleurs: Story = {
  render: () => <div style={{ display: "grid", gap: 24 }}>
    <Grid>{["--tt-bg", "--tt-tile", "--tt-tile-2", "--tt-line", "--tt-ink"].map((n) => <Swatch key={n} name={n} />)}</Grid>
    <Grid>{["--tt-brand", "--tt-brand-mark", "--tt-live", "--tt-gain-ink", "--tt-overlap", "--tt-overlap-strong"].map((n) => <Swatch key={n} name={n} on="--tt-tile" />)}</Grid>
    <Grid>{["--tt-area-1", "--tt-area-2", "--tt-area-3", "--tt-area-4", "--tt-area-5", "--tt-area-6", "--tt-area-other"].map((n) => <Swatch key={n} name={n} on="--tt-tile" />)}</Grid>
  </div>,
};

function Space({ step }: { step: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const value = useToken(ref, `--tt-space-${step}`);
  return <div ref={ref} style={{ display: "grid", gridTemplateColumns: "120px 1fr", alignItems: "center", gap: 12 }}>
    <span style={label}>--tt-space-{step} · {value}</span>
    <span style={{ height: 16, width: `var(--tt-space-${step})`, background: "var(--tt-brand-mark)", borderRadius: 2 }} />
  </div>;
}

/** The 4 px scale, and the measures of the board built on it. */
export const Espacements: Story = {
  render: () => <div style={{ display: "grid", gap: 10 }}>
    {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => <Space key={n} step={n} />)}
    <p style={{ ...label, marginTop: 16 }}>Tuile : marge intérieure --tt-tile-pad, écart --tt-tile-gap ; tableau : --tt-board-gap ; page : --tt-page-gap, --tt-page-pad.</p>
  </div>,
};

/** Radii and the two surfaces a module is built on: the tile, and the card lifted off it. */
export const Surfaces: Story = {
  render: () => <div style={{ display: "grid", gap: 24 }}>
    <Grid min={150}>{["--tt-r-tile", "--tt-r-card", "--tt-r-chip", "--tt-r-pill"].map((r) => <div key={r} style={{ display: "grid", gap: 8 }}>
      <div style={{ height: 72, borderRadius: `var(${r})`, background: "var(--tt-tile)" }} /><span style={label}>{r}</span></div>)}</Grid>
    <div style={{ display: "grid", gap: 16, padding: "var(--tt-tile-pad)", borderRadius: "var(--tt-r-tile)", background: "var(--tt-tile)" }}>
      <span style={{ font: "var(--tt-eyebrow-font)", letterSpacing: "var(--tt-eyebrow-tracking)", textTransform: "uppercase", color: "var(--tt-ink)" }}>tile</span>
      <div style={{ padding: 16, borderRadius: "var(--tt-r-card)", background: "var(--tt-bg)", boxShadow: "var(--tt-card-lift)", ...label }}>raised : --tt-card-lift</div>
      <div style={{ padding: 16, borderRadius: "var(--tt-r-card)", background: "var(--tt-bg)", boxShadow: "var(--tt-row-ring)", ...label }}>rangée : --tt-row-ring</div>
      <div style={{ padding: 16, borderRadius: "var(--tt-r-card)", background: "var(--tt-bg)", boxShadow: "var(--tt-row-ring-on)", ...label }}>rangée choisie : --tt-row-ring-on</div>
    </div>
  </div>,
};

/** Line icons: five sizes, two strokes. A module never sets a pixel size for an icon. */
export const Icones: Story = {
  render: () => <div style={{ display: "grid", gap: 16, color: "var(--tt-ink)" }}>
    {(["xs", "s", "m", "l", "xl"] as const).map((size) => <div key={size} style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <span style={{ ...label, width: 120 }}>--tt-icon-{size}</span>
      {[Plus, Check, Pencil, Search].map((Icon, i) => <Icon key={i} aria-hidden style={{ width: `var(--tt-icon-${size})`, height: `var(--tt-icon-${size})`, strokeWidth: "var(--tt-icon-stroke)" }} />)}
    </div>)}
  </div>,
};

/** States every control shares: focus ring, press, unavailable. Tab to see the focus. */
export const Etats: Story = {
  render: () => {
    const base: CSSProperties = { ...label, minHeight: 40, padding: "0 20px", border: 0, borderRadius: 999, background: "var(--tt-tile-2)", cursor: "pointer" };
    return <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
      <button type="button" style={{ ...base, outline: "var(--tt-focus-ring)", outlineOffset: "var(--tt-focus-offset)" }}>Focus : --tt-focus-ring</button>
      <button type="button" style={{ ...base, transform: "var(--tt-press)" }}>Appui : --tt-press</button>
      <button type="button" style={{ ...base, opacity: "var(--tt-disabled)" }} disabled>Indisponible : --tt-disabled</button>
    </div>;
  },
};

/** Durations and curves. Motion only moves transform and opacity. */
export const Mouvement: Story = {
  render: () => {
    const [on, setOn] = useState(false);
    const rows = [["--tt-dur-press", "--tt-ease"], ["--tt-dur-state", "--tt-ease"], ["--tt-dur-move", "--tt-spring"], ["--tt-dur-reveal", "--tt-ease-io"]];
    return <div style={{ display: "grid", gap: 12, maxWidth: 520 }}>
      <button type="button" onClick={() => setOn((v) => !v)} style={{ ...label, justifySelf: "start", minHeight: 40, padding: "0 20px", border: 0, borderRadius: 999, background: "var(--tt-ink)", color: "var(--tt-bg)", cursor: "pointer" }}>Rejouer</button>
      {rows.map(([dur, ease]) => <div key={dur} style={{ display: "grid", gridTemplateColumns: "200px 1fr", alignItems: "center", gap: 12 }}>
        <span style={label}>{dur} · {ease}</span>
        <span style={{ height: 8, borderRadius: 4, background: "var(--tt-tile)" }}><span style={{ display: "block", width: 24, height: 8, borderRadius: 4, background: "var(--tt-brand-mark)", transform: on ? "translateX(240px)" : "none", transition: `transform var(${dur}) var(${ease})` }} /></span>
      </div>)}
    </div>;
  },
};
