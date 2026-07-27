import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";

export interface FilterDropdownOption {
  id: string;
  label: string;
}

interface FilterDropdownProps {
  label: string;
  allLabel: string;
  options: FilterDropdownOption[];
  value: string;
  onChange: (id: string) => void;
  searchPlaceholder?: string;
  /** Only render the in-panel search field once there are at least this many options. */
  searchThreshold?: number;
  /** Multi-select mode: checkboxes that stay open on click, a count badge
   *  on the trigger, and a "Clear selections" footer — instead of the
   *  single-choice radio-like list that closes on pick. */
  multi?: boolean;
  values?: string[];
  onChangeMulti?: (ids: string[]) => void;
  clearLabel?: string;
}

/**
 * Pill trigger + anchored popover panel — used by ToolsPage (Catégorie) and
 * StacksPage (Profil, Budget). Not a native <select>: gives us an in-panel
 * search field for long lists and a consistent checkmark-list visual
 * language across every quick filter on the site.
 *
 * Panel is portaled to document.body and positioned with fixed coordinates
 * computed from the trigger's own rect — some triggers live inside a row
 * with overflow-x: auto (the mobile filter bar), which would otherwise
 * clip an absolutely-positioned panel's vertical overflow.
 */
export default function FilterDropdown({
  label,
  allLabel,
  options,
  value,
  onChange,
  searchPlaceholder,
  searchThreshold = 8,
  multi = false,
  values = [],
  onChangeMulti,
  clearLabel = "Clear selections",
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const activeOption = options.find((opt) => opt.id === value);
  const showSearch = options.length >= searchThreshold;
  const selectedCount = values.length;

  function closeAndRestoreFocus() {
    setOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function toggleValue(id: string) {
    if (!onChangeMulti) return;
    onChangeMulti(values.includes(id) ? values.filter((v) => v !== id) : [...values, id]);
  }

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [options, query]);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const panelWidth = 280;
    let left = rect.left;
    if (left + panelWidth > window.innerWidth - 16) left = window.innerWidth - 16 - panelWidth;
    if (left < 16) left = 16;
    setCoords({ top: rect.bottom + 6, left });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeAndRestoreFocus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => { if (!open) setQuery(""); }, [open]);

  useEffect(() => {
    if (!open) return;
    const focusFrame = window.requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLElement>('input, button[role="option"]')?.focus();
    });
    return () => window.cancelAnimationFrame(focusFrame);
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`tf-dd-trigger${open ? " tf-dd-trigger--open" : ""}${
          multi ? (selectedCount > 0 ? " tf-dd-trigger--active" : "") : (value !== "all" ? " tf-dd-trigger--active" : "")
        }`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span>{multi ? label : (value === "all" ? label : activeOption?.label ?? label)}</span>
        {multi && selectedCount > 0 && <span className="tf-dd-count">{selectedCount}</span>}
        <ChevronDown className="tf-dd-chevron" aria-hidden />
      </button>

      {open && createPortal(
        <div
          className="tf-dd-panel"
          role="dialog"
          aria-label={label}
          ref={panelRef}
          style={{ position: "fixed", top: coords.top, left: coords.left }}
        >
          {showSearch && (
            <div className="tf-dd-search">
              <Search size={14} aria-hidden />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder || label}
                autoFocus
              />
            </div>
          )}
          <div className="tf-dd-list" role="listbox" aria-label={label} aria-multiselectable={multi}>
            {multi ? (
              filteredOptions.map((opt) => {
                const checked = values.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    className={`tf-dd-item tf-dd-item--checkbox${checked ? " tf-dd-item--active" : ""}`}
                    onClick={() => toggleValue(opt.id)}
                    role="option"
                    aria-selected={checked}
                  >
                    <span className={`tf-dd-checkbox${checked ? " tf-dd-checkbox--checked" : ""}`} aria-hidden>
                      {checked && <Check size={12} aria-hidden />}
                    </span>
                    <span>{opt.label}</span>
                  </button>
                );
              })
            ) : (
              <>
                <button
                  type="button"
                  className={`tf-dd-item${value === "all" ? " tf-dd-item--active" : ""}`}
                  onClick={() => { onChange("all"); closeAndRestoreFocus(); }}
                  role="option"
                  aria-selected={value === "all"}
                >
                  <span>{allLabel}</span>
                  {value === "all" && <Check size={14} aria-hidden />}
                </button>
                {filteredOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`tf-dd-item${value === opt.id ? " tf-dd-item--active" : ""}`}
                    onClick={() => { onChange(opt.id); closeAndRestoreFocus(); }}
                    role="option"
                    aria-selected={value === opt.id}
                  >
                    <span>{opt.label}</span>
                    {value === opt.id && <Check size={14} aria-hidden />}
                  </button>
                ))}
              </>
            )}
            {filteredOptions.length === 0 && (
              <p className="tf-dd-empty">—</p>
            )}
          </div>
          {multi && selectedCount > 0 && (
            <button type="button" className="tf-dd-clear" onClick={() => onChangeMulti?.([])}>
              {clearLabel}
            </button>
          )}
        </div>,
        document.body,
      )}
    </>
  );
}
