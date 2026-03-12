import {
  Bot,
  FolderKanban,
  MessageSquare,
  Palette,
  Banknote,
  HardDrive,
  Workflow,
  ListChecks,
  Mail,
  Users,
  PenTool,
  Shield,
  Clock,
  Globe,
  BarChart3,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";

const categoryIconMap: Record<string, LucideIcon> = {
  "ai-general": Bot,
  "organization": FolderKanban,
  "communication": MessageSquare,
  "creation": Palette,
  "finance": Banknote,
  "storage": HardDrive,
  "automation": Workflow,
  "project-management": ListChecks,
  "email-productivity": Mail,
  "communication-team": Users,
  "design-tools": PenTool,
  "security": Shield,
  "productivity-tracking": Clock,
  "nocode-web": Globe,
  "analytics": BarChart3,
  "formation-education": GraduationCap,
};

export function getCategoryIcon(categoryId: string): LucideIcon {
  return categoryIconMap[categoryId] || FolderKanban;
}
