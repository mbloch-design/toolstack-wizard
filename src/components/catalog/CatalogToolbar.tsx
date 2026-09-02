import { Fragment, useState, type ReactNode } from "react";
import { ChevronDown, MoreHorizontal, X } from "@/lib/icons";
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
};

type Props = {
  pills: ToolbarPill[];
  /** Index après lequel tracer le séparateur de groupe. Omis : pas de séparateur. */
  dividerAfter?: number;
  navLabel: string;
  sort: ToolbarSort;
  /** Contenu du panneau « Plus de filtres ». Absent : pas de bouton. */
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
 * Barre de filtres commune aux catalogues (outils, stacks, comparatifs, guides).
 *
 * Une seule rangée de pilules qui défile, et une queue qui ne défile jamais :
 * « Plus de filtres » puis le tri. Ce qui déborde de la rangée reste donc
 * toujours joignable par le panneau, à n'importe quelle largeur d'écran.
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

  function handlePanelOpenChange(next: boolean) {
    setPanelOpen(next);
    onPanelOpenChange?.(next);
  }

  return (
    <div className={`tt-catalog-toolbar tt-sticky-toolbar${stuck ? " tt-sticky-toolbar--stuck" : ""}${className ? ` ${className}` : ""}`}>
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
        {panel && (
          <Popover open={panelOpen} onOpenChange={handlePanelOpenChange}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={`tt-pill tt-pill--more${activeFilterCount > 0 ? " tt-pill--active" : ""}`}
              >
                <MoreHorizontal size={16} aria-hidden />
                <span>{moreLabel}</span>
                {activeFilterCount > 0 && <span className="tt-pill-count">{activeFilterCount}</span>}
              </button>
            </PopoverTrigger>
            {panelOpen && <div className="tt-filter-panel-backdrop" aria-hidden />}
            <PopoverContent className="tt-filter-panel" align="end" sideOffset={8}>
              <div className="tt-filter-panel-head">
                <strong>{panelTitle}</strong>
                <div className="tt-filter-panel-head-actions">
                  {activeFilterCount > 0 && onClearFilters && clearLabel && (
                    <button type="button" className="tt-filter-panel-reset" onClick={onClearFilters}>
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
              <div className="tt-filter-panel-body">{panel}</div>
            </PopoverContent>
          </Popover>
        )}

        <label className="tt-catalog-sort-control" title={sort.title}>
          <select
            className="tt-catalog-sort-select"
            value={sort.value}
            onChange={(event) => sort.onChange(event.target.value)}
            aria-label={sort.ariaLabel}
          >
            {sort.options.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <ChevronDown size={15} aria-hidden />
        </label>
      </div>
    </div>
  );
}
