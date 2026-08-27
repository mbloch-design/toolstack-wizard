import {
  Banknote,
  Bot,
  Code2,
  Folder,
  FolderKanban,
  Handshake,
  Megaphone,
  Palette,
  Workflow,
  type LucideIcon,
} from "@/lib/icons";

const needIconMap: Record<string, LucideIcon> = {
  ia: Bot,
  organisation: FolderKanban,
  design: Palette,
  automation: Workflow,
  marketing: Megaphone,
  vente: Handshake,
  finance: Banknote,
  dev: Code2,
};

export function getNeedIcon(needId: string): LucideIcon {
  return needIconMap[needId] || Folder;
}
