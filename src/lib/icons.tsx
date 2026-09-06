import * as React from "react";

import { ICON_SPRITE_URL } from "./icon-sprite-url";

export type IconProps = React.SVGProps<SVGSVGElement> & {
  size?: number | string;
  absoluteStrokeWidth?: boolean;
};

export type IconComponent = React.ForwardRefExoticComponent<
  IconProps & React.RefAttributes<SVGSVGElement>
>;

// Temporary type alias for component contracts that previously named the vendor.
export type LucideIcon = IconComponent;

/**
 * Les icônes ne portent plus leurs tracés : elles pointent vers le sprite
 * partagé que produit scripts/gen-icon-sprite.mjs.
 *
 * Recopier les tracés dans chacune des 13 545 pages prérendues coûtait ~25 Ko
 * par page ; une référence en coûte une cinquantaine d'octets, et le sprite est
 * mis en cache une fois pour l'ensemble du site.
 *
 * Les attributs de tracé restent ici, sur le `<svg>` appelant, plutôt que sur
 * le `<symbol>` : ce sont des propriétés héritées, elles traversent donc la
 * référence, et les laisser ici préserve la possibilité pour un appelant de
 * passer son propre `strokeWidth`, ce que fait HomePageV2. Les 151 icônes
 * partagent le même `viewBox` et le même `fill`, et une épaisseur de 1,5 quand
 * elles en ont une, donc ces valeurs peuvent être uniformes.
 *
 * La correspondance vers Iconoir vit dans scripts/icon-sprite-map.mjs, hors du
 * bundle client.
 */
function adaptIcon(spriteId: string): IconComponent {
  return React.forwardRef<SVGSVGElement, IconProps>(function ToolTrimIcon(
    { size = 24, absoluteStrokeWidth: _absoluteStrokeWidth, ...props },
    ref,
  ) {
    return (
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth={1.5}
        xmlns="http://www.w3.org/2000/svg"
        color="currentColor"
        {...props}
      >
        <use href={`${ICON_SPRITE_URL}#${spriteId}`} />
      </svg>
    );
  });
}

export const Activity = adaptIcon("tt-activity");
export const AlertTriangle = adaptIcon("tt-alert-triangle");
export const ArrowDown = adaptIcon("tt-arrow-down");
export const ArrowDownCircle = adaptIcon("tt-arrow-down-circle");
export const ArrowLeft = adaptIcon("tt-arrow-left");
export const ArrowRight = adaptIcon("tt-arrow-right");
export const ArrowUp = adaptIcon("tt-arrow-up");
export const ArrowUpDown = adaptIcon("tt-arrow-up-down");
export const ArrowUpRight = adaptIcon("tt-arrow-up-right");
export const BadgeCheck = adaptIcon("tt-badge-check");
export const Ban = adaptIcon("tt-ban");
export const Banknote = adaptIcon("tt-banknote");
export const BarChart2 = adaptIcon("tt-bar-chart2");
export const BarChart3 = adaptIcon("tt-bar-chart3");
export const BookOpen = adaptIcon("tt-book-open");
export const BookOpenText = adaptIcon("tt-book-open-text");
export const Bookmark = adaptIcon("tt-bookmark");
export const BookmarkCheck = adaptIcon("tt-bookmark-check");
export const Bot = adaptIcon("tt-bot");
export const Boxes = adaptIcon("tt-boxes");
export const Brain = adaptIcon("tt-brain");
export const Briefcase = adaptIcon("tt-briefcase");
export const BriefcaseBusiness = adaptIcon("tt-briefcase-business");
export const Building2 = adaptIcon("tt-building2");
export const Calculator = adaptIcon("tt-calculator");
export const Camera = adaptIcon("tt-camera");
export const Check = adaptIcon("tt-check");
export const CheckCircle = adaptIcon("tt-check-circle");
export const CheckCircle2 = adaptIcon("tt-check-circle2");
export const ChevronDown = adaptIcon("tt-chevron-down");
export const ChevronLeft = adaptIcon("tt-chevron-left");
export const ChevronRight = adaptIcon("tt-chevron-right");
export const ChevronUp = adaptIcon("tt-chevron-up");
export const Circle = adaptIcon("tt-circle");
export const CircleAlert = adaptIcon("tt-circle-alert");
export const CircleDollarSign = adaptIcon("tt-circle-dollar-sign");
export const CircleDot = adaptIcon("tt-circle-dot");
export const CircleMinus = adaptIcon("tt-circle-minus");
export const CirclePlus = adaptIcon("tt-circle-plus");
export const ClipboardCheck = adaptIcon("tt-clipboard-check");
export const Clock = adaptIcon("tt-clock");
export const Clock3 = adaptIcon("tt-clock3");
export const Cloud = adaptIcon("tt-cloud");
export const Code2 = adaptIcon("tt-code2");
export const Compass = adaptIcon("tt-compass");
export const Copy = adaptIcon("tt-copy");
export const Cpu = adaptIcon("tt-cpu");
export const CreditCard = adaptIcon("tt-credit-card");
export const Database = adaptIcon("tt-database");
export const DollarSign = adaptIcon("tt-dollar-sign");
export const Dot = adaptIcon("tt-dot");
export const Download = adaptIcon("tt-download");
export const Euro = adaptIcon("tt-euro");
export const ExternalLink = adaptIcon("tt-external-link");
export const Eye = adaptIcon("tt-eye");
export const FileText = adaptIcon("tt-file-text");
export const Filter = adaptIcon("tt-filter");
export const Flag = adaptIcon("tt-flag");
export const Flame = adaptIcon("tt-flame");
export const Folder = adaptIcon("tt-folder");
export const FolderKanban = adaptIcon("tt-folder-kanban");
export const FolderPlus = adaptIcon("tt-folder-plus");
export const Gauge = adaptIcon("tt-gauge");
export const GitCompare = adaptIcon("tt-git-compare");
export const Globe = adaptIcon("tt-globe");
export const GraduationCap = adaptIcon("tt-graduation-cap");
export const GripVertical = adaptIcon("tt-grip-vertical");
export const Handshake = adaptIcon("tt-handshake");
export const HardDrive = adaptIcon("tt-hard-drive");
export const Hash = adaptIcon("tt-hash");
export const Headphones = adaptIcon("tt-headphones");
export const Heart = adaptIcon("tt-heart");
export const HelpCircle = adaptIcon("tt-help-circle");
export const Home = adaptIcon("tt-home");
export const Info = adaptIcon("tt-info");
export const Languages = adaptIcon("tt-languages");
export const Laptop2 = adaptIcon("tt-laptop2");
export const Layers = adaptIcon("tt-layers");
export const Layers3 = adaptIcon("tt-layers3");
export const LayoutGrid = adaptIcon("tt-layout-grid");
export const Lightbulb = adaptIcon("tt-lightbulb");
export const Link2 = adaptIcon("tt-link2");
export const Linkedin = adaptIcon("tt-linkedin");
export const List = adaptIcon("tt-list");
export const ListChecks = adaptIcon("tt-list-checks");
export const Loader2 = adaptIcon("tt-loader2");
export const LoaderCircle = adaptIcon("tt-loader-circle");
export const Lock = adaptIcon("tt-lock");
export const LogOut = adaptIcon("tt-log-out");
export const Mail = adaptIcon("tt-mail");
export const Megaphone = adaptIcon("tt-megaphone");
export const Menu = adaptIcon("tt-menu");
export const MessageCircle = adaptIcon("tt-message-circle");
export const MessageSquare = adaptIcon("tt-message-square");
export const MessagesSquare = adaptIcon("tt-messages-square");
export const Minus = adaptIcon("tt-minus");
export const Moon = adaptIcon("tt-moon");
export const MoreHorizontal = adaptIcon("tt-more-horizontal");
export const Package = adaptIcon("tt-package");
export const Palette = adaptIcon("tt-palette");
export const PanelLeft = adaptIcon("tt-panel-left");
export const PanelLeftClose = adaptIcon("tt-panel-left-close");
export const PanelLeftOpen = adaptIcon("tt-panel-left-open");
export const Pen = adaptIcon("tt-pen");
export const Pencil = adaptIcon("tt-pencil");
export const PenLine = adaptIcon("tt-pen-line");
export const PenTool = adaptIcon("tt-pen-tool");
export const PiggyBank = adaptIcon("tt-piggy-bank");
export const Play = adaptIcon("tt-play");
export const PlayCircle = adaptIcon("tt-play-circle");
export const Plug = adaptIcon("tt-plug");
export const Plus = adaptIcon("tt-plus");
export const Puzzle = adaptIcon("tt-puzzle");
export const Receipt = adaptIcon("tt-receipt");
export const RefreshCcw = adaptIcon("tt-refresh-ccw");
export const RefreshCw = adaptIcon("tt-refresh-cw");
export const Rocket = adaptIcon("tt-rocket");
export const RotateCcw = adaptIcon("tt-rotate-ccw");
export const Save = adaptIcon("tt-save");
export const Scale = adaptIcon("tt-scale");
export const Scissors = adaptIcon("tt-scissors");
export const Search = adaptIcon("tt-search");
export const SearchCheck = adaptIcon("tt-search-check");
export const Settings2 = adaptIcon("tt-settings2");
export const Share2 = adaptIcon("tt-share2");
export const Shield = adaptIcon("tt-shield");
export const ShieldAlert = adaptIcon("tt-shield-alert");
export const ShieldCheck = adaptIcon("tt-shield-check");
export const ShoppingCart = adaptIcon("tt-shopping-cart");
export const SlidersHorizontal = adaptIcon("tt-sliders-horizontal");
export const Sparkles = adaptIcon("tt-sparkles");
export const Star = adaptIcon("tt-star");
export const StarSolid = adaptIcon("tt-star-solid");
export const Sun = adaptIcon("tt-sun");
export const Swords = adaptIcon("tt-swords");
export const Tag = adaptIcon("tt-tag");
export const Target = adaptIcon("tt-target");
export const Trash2 = adaptIcon("tt-trash2");
export const TrendingDown = adaptIcon("tt-trending-down");
export const TrendingUp = adaptIcon("tt-trending-up");
export const Twitter = adaptIcon("tt-twitter");
export const User = adaptIcon("tt-user");
export const UserRound = adaptIcon("tt-user-round");
export const Users = adaptIcon("tt-users");
export const Video = adaptIcon("tt-video");
export const Wallet = adaptIcon("tt-wallet");
export const WandSparkles = adaptIcon("tt-wand-sparkles");
export const Workflow = adaptIcon("tt-workflow");
export const Wrench = adaptIcon("tt-wrench");
export const X = adaptIcon("tt-x");
export const Zap = adaptIcon("tt-zap");
