import { Fragment, useState, type ReactNode } from "react";
import { ArrowUpDown, Filter, X } from "@/lib/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type ToolbarPill = {
  id: string;
  label: string;
  active?: boolean;
  onClick: () => void;
};

export type ToolbarSort = {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  /** Libellé lu par les lecteurs d'écran, ex. « Trier par ». */
  ariaLabel: string;
  title?: string;
  /** Titre du groupe de tri dans le panneau. Défaut : ariaLabel. */
  groupLabel?: string;
  /** Valeur par défaut, qui ne compte pas comme un filtre actif. Défaut : la première option. */
  defaultValue?: string;
};

type Props = {
  pills: ToolbarPill[];
  /** Index après lequel tracer le séparateur de groupe. Omis : pas de séparateur. */
  dividerAfter?: number;
  navLabel: string;
  sort: ToolbarSort;
  /** Filtres du panneau, rendus sous le tri. Absent : le panneau ne porte que le tri. */
  panel?: ReactNode;
  panelTitle: string;
  moreLabel: string;
  clearLabel?: string;
  /** Lu par les lecteurs d'écran sur le bouton de fermeture affiché en
      feuille mobile (le panneau devient un bottom sheet sous 640px). */
  closeLabel?: string;
  activeFilterCount?: number;
  onClearFilters?: () => void;
  /** Rendu dans la queue, avant « Plus de filtres » — ex. une recherche en ligne. */
  extraTail?: ReactNode;
  /** L'appelant en a besoin pour ne calculer les compteurs de facettes que
      pendant que le panneau est réellement visible. */
  onPanelOpenChange?: (open: boolean) => void;
  stuck?: boolean;
  className?: string;
};

/**
 * Barre de filtres commune aux catalogues (stacks, comparatifs), alignée sur
 * celle de /tools.
 *
 * Une seule ligne à toutes les largeurs : la rangée de pilules défile, et un
 * unique bouton reste à droite. Le tri vit dans son panneau, en premier
 * groupe ; un tri autre que celui par défaut compte comme un filtre actif.
 *
 * Le motif remplace les rails à flèches, qui posaient un bouton opaque sur un
 * libellé de catégorie — masqué en permanence et inatteignable au clic — et
 * qui, sous 400 px, ne laissaient plus qu'un onglet et demi lisible.
 */
export default function CatalogToolbar({
  pills,
  dividerAfter,
  navLabel,
  sort,
  panel,
  panelTitle,
  moreLabel,
  clearLabel,
  closeLabel = "Close",
  activeFilterCount = 0,
  onClearFilters,
  extraTail,
  onPanelOpenChange,
  stuck = false,
  className = "",
}: Props) {
  const [panelOpen, setPanelOpen] = useState(false);
  const defaultSort = sort.defaultValue ?? sort.options[0]?.value;
  const sortChanged = sort.value !== defaultSort;
  const badgeCount = activeFilterCount + (sortChanged ? 1 : 0);
  // Sans facettes, le bouton n'ouvre que le tri : il le dit et le montre.
  const TriggerIcon = panel ? Filter : ArrowUpDown;

  function handlePanelOpenChange(next: boolean) {
    setPanelOpen(next);
    onPanelOpenChange?.(next);
  }

  function clearAll() {
    onClearFilters?.();
    if (sortChanged && defaultSort) sort.onChange(defaultSort);
  }

  return (
    <>
      <div data-toolbar="catalog" className={`tt-catalog-toolbar tt-sticky-toolbar${stuck ? " tt-sticky-toolbar--stuck" : ""}${className ? ` ${className}` : ""}`}>
        <nav className="tt-pillrow" aria-label={navLabel}>
          {pills.map((pill, index) => (
            <Fragment key={pill.id}>
              <button
                type="button"
                className={`tt-pill${pill.active ? " tt-pill--active" : ""}`}
                onClick={pill.onClick}
                aria-pressed={!!pill.active}
              >
                {pill.label}
              </button>
              {dividerAfter === index && <span className="tt-pillrow-divider" aria-hidden />}
            </Fragment>
          ))}
        </nav>

        <div className="tt-catalog-toolbar-tail">
          {extraTail}
          <Popover open={panelOpen} onOpenChange={handlePanelOpenChange}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={`tt-pill tt-pill--more${badgeCount > 0 ? " tt-pill--active" : ""}`}
                aria-label={moreLabel}
                title={sort.title}
              >
                <TriggerIcon size={16} aria-hidden />
                <span className="tt-pill-label">{moreLabel}</span>
                {badgeCount > 0 && <span className="tt-pill-count">{badgeCount}</span>}
              </button>
            </PopoverTrigger>
            <PopoverContent className="tt-filter-panel" align="end" sideOffset={8}>
              <div className="tt-filter-panel-head">
                <strong>{panelTitle}</strong>
                <div className="tt-filter-panel-head-actions">
                  {badgeCount > 0 && clearLabel && (
                    <button type="button" className="tt-filter-panel-reset" onClick={clearAll}>
                      {clearLabel}
                    </button>
                  )}
                  <button
                    type="button"
                    className="tt-filter-panel-close"
                    onClick={() => handlePanelOpenChange(false)}
                    aria-label={closeLabel}
                  >
                    <X size={18} aria-hidden />
                  </button>
                </div>
              </div>
              <div className="tt-filter-panel-body">
                <section className="tt-filter-group">
                  <h3>{sort.groupLabel ?? sort.ariaLabel}</h3>
                  <div className="tt-filter-segmented" role="radiogroup" aria-label={sort.ariaLabel}>
                    {sort.options.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={sort.value === option.value}
                        className={`tt-pill${sort.value === option.value ? " tt-pill--active" : ""}`}
                        onClick={() => sort.onChange(option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </section>
                {panel}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      {/* Outside the bar: its stuck-state animation leaves a transform that
          would trap this fixed scrim inside the bar's own box. */}
      {panelOpen && <div className="tt-filter-panel-backdrop" aria-hidden />}
    </>
  );
}
