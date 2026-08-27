import * as React from "react";
import * as Iconoir from "iconoir-react";

export type IconProps = React.SVGProps<SVGSVGElement> & {
  size?: number | string;
  absoluteStrokeWidth?: boolean;
};

export type IconComponent = React.ForwardRefExoticComponent<
  IconProps & React.RefAttributes<SVGSVGElement>
>;

// Temporary type alias for component contracts that previously named the vendor.
export type LucideIcon = IconComponent;

type IconoirIcon = React.ForwardRefExoticComponent<
  Omit<React.SVGProps<SVGSVGElement>, "ref"> & React.RefAttributes<SVGSVGElement>
>;

function adaptIcon(Component: IconoirIcon): IconComponent {
  return React.forwardRef<SVGSVGElement, IconProps>(function ToolTrimIcon(
    { size = 24, absoluteStrokeWidth: _absoluteStrokeWidth, ...props },
    ref,
  ) {
    return <Component ref={ref} width={size} height={size} {...props} />;
  });
}

export const Activity = adaptIcon(Iconoir.Activity);
export const AlertTriangle = adaptIcon(Iconoir.WarningTriangle);
export const ArrowDown = adaptIcon(Iconoir.ArrowDown);
export const ArrowDownCircle = adaptIcon(Iconoir.ArrowDownCircle);
export const ArrowLeft = adaptIcon(Iconoir.ArrowLeft);
export const ArrowRight = adaptIcon(Iconoir.ArrowRight);
export const ArrowUp = adaptIcon(Iconoir.ArrowUp);
export const ArrowUpDown = adaptIcon(Iconoir.DataTransferBoth);
export const ArrowUpRight = adaptIcon(Iconoir.ArrowUpRight);
export const BadgeCheck = adaptIcon(Iconoir.BadgeCheck);
export const Ban = adaptIcon(Iconoir.Prohibition);
export const Banknote = adaptIcon(Iconoir.Cash);
export const BarChart2 = adaptIcon(Iconoir.StatsReport);
export const BarChart3 = adaptIcon(Iconoir.StatsUpSquare);
export const BookOpen = adaptIcon(Iconoir.OpenBook);
export const BookOpenText = adaptIcon(Iconoir.Book);
export const Bookmark = adaptIcon(Iconoir.Bookmark);
export const BookmarkCheck = adaptIcon(Iconoir.FavouriteBook);
export const Bot = adaptIcon(Iconoir.BrainElectricity);
export const Boxes = adaptIcon(Iconoir.Packages);
export const Brain = adaptIcon(Iconoir.Brain);
export const Briefcase = adaptIcon(Iconoir.Suitcase);
export const BriefcaseBusiness = adaptIcon(Iconoir.Suitcase);
export const Building2 = adaptIcon(Iconoir.Building);
export const Calculator = adaptIcon(Iconoir.Calculator);
export const Camera = adaptIcon(Iconoir.Camera);
export const Check = adaptIcon(Iconoir.Check);
export const CheckCircle = adaptIcon(Iconoir.CheckCircle);
export const CheckCircle2 = adaptIcon(Iconoir.CheckCircle);
export const ChevronDown = adaptIcon(Iconoir.NavArrowDown);
export const ChevronLeft = adaptIcon(Iconoir.NavArrowLeft);
export const ChevronRight = adaptIcon(Iconoir.NavArrowRight);
export const ChevronUp = adaptIcon(Iconoir.NavArrowUp);
export const Circle = adaptIcon(Iconoir.Circle);
export const CircleAlert = adaptIcon(Iconoir.WarningCircle);
export const CircleDollarSign = adaptIcon(Iconoir.DollarCircle);
export const CircleDot = adaptIcon(Iconoir.OnePointCircle);
export const CircleMinus = adaptIcon(Iconoir.MinusCircle);
export const CirclePlus = adaptIcon(Iconoir.PlusCircle);
export const ClipboardCheck = adaptIcon(Iconoir.ClipboardCheck);
export const Clock = adaptIcon(Iconoir.Clock);
export const Clock3 = adaptIcon(Iconoir.Clock);
export const Cloud = adaptIcon(Iconoir.Cloud);
export const Code2 = adaptIcon(Iconoir.CodeBrackets);
export const Compass = adaptIcon(Iconoir.Compass);
export const Copy = adaptIcon(Iconoir.Copy);
export const Cpu = adaptIcon(Iconoir.Cpu);
export const CreditCard = adaptIcon(Iconoir.CreditCard);
export const Database = adaptIcon(Iconoir.Database);
export const DollarSign = adaptIcon(Iconoir.Dollar);
export const Dot = adaptIcon(Iconoir.OnePointCircle);
export const Download = adaptIcon(Iconoir.Download);
export const Euro = adaptIcon(Iconoir.Euro);
export const ExternalLink = adaptIcon(Iconoir.OpenNewWindow);
export const Eye = adaptIcon(Iconoir.Eye);
export const FileText = adaptIcon(Iconoir.Page);
export const Filter = adaptIcon(Iconoir.Filter);
export const Flag = adaptIcon(Iconoir.WhiteFlag);
export const Flame = adaptIcon(Iconoir.FireFlame);
export const Folder = adaptIcon(Iconoir.Folder);
export const FolderKanban = adaptIcon(Iconoir.KanbanBoard);
export const FolderPlus = adaptIcon(Iconoir.FolderPlus);
export const Gauge = adaptIcon(Iconoir.DashboardSpeed);
export const GitCompare = adaptIcon(Iconoir.GitCompare);
export const Globe = adaptIcon(Iconoir.Globe);
export const GraduationCap = adaptIcon(Iconoir.GraduationCap);
export const GripVertical = adaptIcon(Iconoir.Drag);
export const Handshake = adaptIcon(Iconoir.HandCard);
export const HardDrive = adaptIcon(Iconoir.HardDrive);
export const Hash = adaptIcon(Iconoir.Hashtag);
export const Headphones = adaptIcon(Iconoir.Headset);
export const Heart = adaptIcon(Iconoir.Heart);
export const HelpCircle = adaptIcon(Iconoir.HelpCircle);
export const Home = adaptIcon(Iconoir.HomeSimple);
export const Info = adaptIcon(Iconoir.InfoCircle);
export const Languages = adaptIcon(Iconoir.Translate);
export const Laptop2 = adaptIcon(Iconoir.Laptop);
export const Layers = adaptIcon(Iconoir.MultiplePages);
export const Layers3 = adaptIcon(Iconoir.ViewStructureUp);
export const LayoutGrid = adaptIcon(Iconoir.ViewGrid);
export const Lightbulb = adaptIcon(Iconoir.LightBulb);
export const Link2 = adaptIcon(Iconoir.Link);
export const Linkedin = adaptIcon(Iconoir.Linkedin);
export const List = adaptIcon(Iconoir.List);
export const ListChecks = adaptIcon(Iconoir.TaskList);
export const Loader2 = adaptIcon(Iconoir.Refresh);
export const LoaderCircle = adaptIcon(Iconoir.RefreshCircle);
export const Lock = adaptIcon(Iconoir.Lock);
export const LogOut = adaptIcon(Iconoir.LogOut);
export const Mail = adaptIcon(Iconoir.Mail);
export const Megaphone = adaptIcon(Iconoir.Megaphone);
export const Menu = adaptIcon(Iconoir.Menu);
export const MessageCircle = adaptIcon(Iconoir.ChatBubble);
export const MessageSquare = adaptIcon(Iconoir.ChatBubble);
export const MessagesSquare = adaptIcon(Iconoir.MultiBubble);
export const Minus = adaptIcon(Iconoir.Minus);
export const Moon = adaptIcon(Iconoir.HalfMoon);
export const MoreHorizontal = adaptIcon(Iconoir.MoreHoriz);
export const Package = adaptIcon(Iconoir.Package);
export const Palette = adaptIcon(Iconoir.Palette);
export const PanelLeft = adaptIcon(Iconoir.SidebarCollapse);
export const PanelLeftClose = adaptIcon(Iconoir.SidebarCollapse);
export const PanelLeftOpen = adaptIcon(Iconoir.SidebarExpand);
export const Pen = adaptIcon(Iconoir.DesignPencil);
export const Pencil = adaptIcon(Iconoir.EditPencil);
export const PenLine = adaptIcon(Iconoir.EditPencil);
export const PenTool = adaptIcon(Iconoir.DesignNib);
export const PiggyBank = adaptIcon(Iconoir.PiggyBank);
export const Play = adaptIcon(Iconoir.Play);
export const PlayCircle = adaptIcon(Iconoir.PlaylistPlay);
export const Plug = adaptIcon(Iconoir.EvPlug);
export const Plus = adaptIcon(Iconoir.Plus);
export const Puzzle = adaptIcon(Iconoir.Puzzle);
export const Receipt = adaptIcon(Iconoir.Page);
export const RefreshCcw = adaptIcon(Iconoir.RefreshDouble);
export const RefreshCw = adaptIcon(Iconoir.Refresh);
export const Rocket = adaptIcon(Iconoir.Rocket);
export const RotateCcw = adaptIcon(Iconoir.UndoCircle);
export const Save = adaptIcon(Iconoir.FloppyDisk);
export const Scale = adaptIcon(Iconoir.Weight);
export const Scissors = adaptIcon(Iconoir.Scissor);
export const Search = adaptIcon(Iconoir.Search);
export const SearchCheck = adaptIcon(Iconoir.SearchWindow);
export const Settings2 = adaptIcon(Iconoir.Settings);
export const Share2 = adaptIcon(Iconoir.ShareAndroid);
export const Shield = adaptIcon(Iconoir.Shield);
export const ShieldAlert = adaptIcon(Iconoir.ShieldAlert);
export const ShieldCheck = adaptIcon(Iconoir.ShieldCheck);
export const ShoppingCart = adaptIcon(Iconoir.Cart);
export const SlidersHorizontal = adaptIcon(Iconoir.SettingsProfiles);
export const Sparkles = adaptIcon(Iconoir.Sparks);
export const Sun = adaptIcon(Iconoir.SunLight);
export const Swords = adaptIcon(Iconoir.Tournament);
export const Tag = adaptIcon(Iconoir.Label);
export const Target = adaptIcon(Iconoir.PrecisionTool);
export const Trash2 = adaptIcon(Iconoir.Trash);
export const TrendingDown = adaptIcon(Iconoir.StatDown);
export const TrendingUp = adaptIcon(Iconoir.StatUp);
export const Twitter = adaptIcon(Iconoir.Twitter);
export const User = adaptIcon(Iconoir.User);
export const UserRound = adaptIcon(Iconoir.UserCircle);
export const Users = adaptIcon(Iconoir.Group);
export const Video = adaptIcon(Iconoir.VideoCamera);
export const Wallet = adaptIcon(Iconoir.Wallet);
export const WandSparkles = adaptIcon(Iconoir.MagicWand);
export const Workflow = adaptIcon(Iconoir.Network);
export const Wrench = adaptIcon(Iconoir.Wrench);
export const X = adaptIcon(Iconoir.Xmark);
export const Zap = adaptIcon(Iconoir.Flash);
