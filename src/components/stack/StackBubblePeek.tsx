import { cloneElement, useEffect, useRef, useState, type ReactElement } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ToolLogo from "@/components/ToolLogo";
import { ChevronRight } from "@/lib/icons";
import { toolKey } from "@/lib/stackView";
import type { ToolSummary } from "@/hooks/useSupabaseData";

export default function StackBubblePeek({ children, tools, label, lang, disabled, group, onExplore, onSelect }: {
  children: ReactElement; tools: ToolSummary[]; label: string; lang: string; disabled: boolean; group: boolean;
  onExplore: () => void; onSelect: (slug: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const touch = useRef(false);
  const keyboard = useRef(false);
  const content = useRef<HTMLDivElement>(null);
  const en = lang === "en";
  function cancel() { clearTimeout(timer.current); }
  function show() { cancel(); if (!disabled) timer.current = setTimeout(() => setOpen(true), 180); }
  function hide() { cancel(); timer.current = setTimeout(() => setOpen(false), 180); }
  useEffect(() => { if (disabled) { cancel(); setOpen(false); } }, [disabled]);
  useEffect(() => () => cancel(), []);
  return <Popover open={open && !disabled} onOpenChange={setOpen}>
    <PopoverTrigger asChild>{cloneElement(children, {
      title: undefined,
      "aria-keyshortcuts": "ArrowDown",
      onPointerEnter: (event: React.PointerEvent) => { if (event.pointerType !== "touch") show(); },
      onPointerLeave: (event: React.PointerEvent) => { if (event.pointerType !== "touch") hide(); },
      onPointerDown: (event: React.PointerEvent) => { touch.current = event.pointerType === "touch"; keyboard.current = false; },
      onKeyDown: (event: React.KeyboardEvent) => {
        touch.current = false;
        if (event.key === "ArrowDown") {
          event.preventDefault(); cancel(); keyboard.current = true; setOpen(true);
          content.current?.querySelector<HTMLButtonElement>("button")?.focus();
        }
        if (event.key === "Escape") { cancel(); setOpen(false); }
      },
      onClick: (event: React.MouseEvent) => {
        event.preventDefault(); cancel();
        if (touch.current) { setOpen(true); return; }
        setOpen(false); onExplore();
      },
    })}</PopoverTrigger>
    <PopoverContent ref={content} className="ms-bubble-peek" side="right" align="center" sideOffset={8}
      onPointerEnter={cancel} onPointerLeave={hide}
      onFocusCapture={cancel}
      onOpenAutoFocus={(event) => { if (!keyboard.current) event.preventDefault(); }}
      onCloseAutoFocus={(event) => { if (!keyboard.current) event.preventDefault(); }}>
      {group && <header><strong>{label}</strong><span>{tools.length} {en ? "tools" : "outils"}</span></header>}
      <div className="ms-bubble-peek-list">{tools.map(tool => {
        const description = en ? tool.shortDescriptionEn || tool.shortDescription : tool.shortDescription;
        return <button type="button" key={tool.id} onClick={() => { cancel(); setOpen(false); onSelect(toolKey(tool)); }}>
          <ToolLogo tool={tool} size={28} /><span><strong>{tool.name}</strong>{description && <span>{description}</span>}</span><ChevronRight size={14} aria-hidden />
        </button>;
      })}</div>
      {group && <button type="button" className="ms-bubble-peek-explore" onClick={() => { setOpen(false); onExplore(); }}>{en ? "Explore this group" : "Explorer ce groupe"}<ChevronRight size={14} aria-hidden /></button>}
    </PopoverContent>
  </Popover>;
}
